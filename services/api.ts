import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '../supabase/client';
// FIX: Added .ts extension to fix module resolution error.
import { Report, User, UserRole, Worker, ReportStatus, StatusUpdate, ReportCategory } from '../types.ts';

// FIX: Initialize the Gemini AI client as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AUTH ---
export const loginUser = async (email: string, password: string): Promise<User | null> => {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData.user) {
    console.error('Login error:', authError?.message);
    return null;
  }
  const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
  if (userError || !userData) {
    console.error('Error fetching user profile:', userError?.message);
    // Maybe sign out the user if profile doesn't exist
    await supabase.auth.signOut();
    return null;
  }
  return { id: userData.id, name: userData.name, email: userData.email, role: userData.role };
};

export const registerUser = async (newUser: Pick<User, 'name' | 'email'> & { password: string }): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
            data: {
                name: newUser.name,
            }
        }
    });
    if (error) {
        console.error('Registration error:', error.message);
        return null;
    }
    // Note: Supabase inserts into auth.users, a trigger/function should copy to public.users
    return data.user ? { id: data.user.id, name: newUser.name, email: newUser.email, role: UserRole.Citizen } : null;
};

// --- REPORTS ---
export const getReports = async (): Promise<Report[]> => {
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching reports:', error);
        return [];
    }
    return data as Report[];
};

export const submitReport = async (reportData: Omit<Report, 'id' | 'created_at' | 'submitted_by_name' | 'status_history' | 'vote_count'> & { timestamp?: number }): Promise<Report | null> => {
    let imageUrl = null;
    if (reportData.image_data) {
        const fileExt = reportData.image_url?.split('.').pop() || 'png';
        const fileName = `report_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('report-images').upload(fileName, Buffer.from(reportData.image_data, 'base64'), {
            contentType: `image/${fileExt}`,
            upsert: false,
        });

        if (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new Error('Image upload failed');
        }
        const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
    }

    const newReport = {
        title: reportData.title,
        description: reportData.description,
        location: reportData.location,
        category: reportData.category,
        image_url: imageUrl,
        submitted_by: reportData.submitted_by,
        status: ReportStatus.Pending,
    };

    const { data, error } = await supabase.from('reports').insert([newReport]).select().single();
    if (error) {
        console.error('Error submitting report:', error);
        return null;
    }
    return data as Report;
};

export const updateReportStatus = async (reportId: number, status: ReportStatus, assignedTo?: number, note?: string): Promise<Report | null> => {
    const updatePayload: any = { status };
    if (status === ReportStatus.Assigned && assignedTo) {
        updatePayload.assigned_to = assignedTo;
    }

    const { data: existingReport, error: fetchError } = await supabase.from('reports').select('status_history').eq('id', reportId).single();
    if (fetchError) {
        console.error('Error fetching existing report for update:', fetchError);
        return null;
    }

    const newStatusUpdate: StatusUpdate = { status, timestamp: new Date(), notes: note };
    const newHistory = [...(existingReport.status_history || []), newStatusUpdate];
    updatePayload.status_history = newHistory;

    const { data, error } = await supabase.from('reports').update(updatePayload).eq('id', reportId).select().single();
    if (error) {
        console.error('Error updating status:', error);
        return null;
    }
    return data as Report;
};

export const addNoteToReport = async (reportId: number, note: string): Promise<Report | null> => {
    const { data: existingReport, error: fetchError } = await supabase.from('reports').select('status, status_history').eq('id', reportId).single();
    if (fetchError) {
        console.error('Error fetching existing report for note:', fetchError);
        return null;
    }

    const newStatusUpdate: StatusUpdate = { status: existingReport.status, timestamp: new Date(), notes: note };
    const newHistory = [...(existingReport.status_history || []), newStatusUpdate];

    const { data, error } = await supabase.from('reports').update({ status_history: newHistory }).eq('id', reportId).select().single();
    if (error) {
        console.error('Error adding note:', error);
        return null;
    }
    return data as Report;
};

// --- VOTES ---
export const addVote = async (reportId: number, userId: string) => {
    const { error } = await supabase.from('votes').insert([{ report_id: reportId, user_id: userId }]);
    return { success: !error };
};
export const removeVote = async (reportId: number, userId: string) => {
    const { error } = await supabase.from('votes').delete().match({ report_id: reportId, user_id: userId });
    return { success: !error };
};
export const getMyVotesForReports = async (reportIds: number[], userId: string): Promise<Map<number, boolean>> => {
    const { data, error } = await supabase.from('votes').select('report_id').eq('user_id', userId).in('report_id', reportIds);
    const voteMap = new Map<number, boolean>();
    if (data && !error) {
        data.forEach(vote => voteMap.set(vote.report_id, true));
    }
    return voteMap;
};

// --- WORKERS & USERS ---
export const getWorkers = async (): Promise<Worker[]> => {
    const { data, error } = await supabase.from('workers').select('*');
    return error ? [] : data;
};
export const addWorker = async (worker: Omit<Worker, 'id'>) => {
    await supabase.from('workers').insert([worker]);
};
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    return error ? [] : (data as User[]);
};

// --- MISC ---
export const addContactMessage = async (message: { name: string, email: string, message: string }) => {
    await supabase.from('contact_messages').insert([message]);
};
export const addFeedback = async (feedback: any) => {
    await supabase.from('feedback').insert([feedback]);
};


// --- GEMINI AI FUNCTIONS ---

export const getAIReportAnalysis = async (reports: Report[]): Promise<string> => {
    if (reports.length === 0) return "No reports to analyze.";
    const prompt = `
        Analyze the following list of civic issue reports and provide a concise summary.
        The summary should identify urgent issues, common themes or categories, and suggest potential areas for resource allocation.
        Format the output with Markdown. Use headings for "Urgent Issues", "Common Themes", and "Recommendations". Use bullet points within each section.

        Reports:
        ${reports.map(r => `- ID ${r.id}: ${r.title} (Category: ${r.category}, Status: ${r.status}, Location: ${r.location})`).join('\n')}
    `;
    try {
        // FIX: Use ai.models.generateContent as per guidelines
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API error (getAIReportAnalysis):", error);
        throw new Error("Failed to get AI analysis.");
    }
};

export const findSimilarReports = async (report: Report): Promise<Report[]> => {
    // In a real app, this might be a more sophisticated vector search.
    // Here, we'll fetch recent, non-resolved reports and let the AI decide.
    const { data, error } = await supabase.from('reports').select('*').neq('status', ReportStatus.Resolved).neq('id', report.id).limit(50);
    if (error || !data || data.length === 0) return [];
    
    const prompt = `
      From the following list of existing reports, identify up to 3 reports that are most similar to the "New Report".
      Consider the title, description, and category.
      Respond ONLY with a JSON array of the IDs of the similar reports, like [101, 204, 315]. If none are similar, respond with an empty array [].

      New Report:
      - Title: "${report.title}"
      - Description: "${report.description}"
      - Category: ${report.category}

      Existing Reports:
      ${data.map(r => `{"id": ${r.id}, "title": "${r.title}", "description": "${r.description}", "category": "${r.category}"}`).join('\n')}
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const similarIds = JSON.parse(response.text.trim());
        return data.filter(r => similarIds.includes(r.id));
    } catch (e) {
        console.error("Gemini API error (findSimilarReports):", e);
        return [];
    }
};

export const getETR = async (report: Pick<Report, 'title' | 'description' | 'location' | 'category'>): Promise<string> => {
    const prompt = `
        Based on the following civic issue report, provide an estimated time to resolution (ETR).
        Consider factors like the category of the issue and potential complexity.
        Provide a concise estimate like "1-3 business days", "5-7 business days", or "Requires further assessment".
        Do not add any extra explanation.

        Report Details:
        - Category: ${report.category}
        - Title: ${report.title}
        - Description: ${report.description}
        - Location: ${report.location}
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API error (getETR):", error);
        return "Could not be estimated.";
    }
};

export const geocodeAddressWithGemini = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    const prompt = `
        Provide the latitude and longitude for the following address: "${address}".
    `;
    try {
        // FIX: Use JSON output with a response schema as per guidelines
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER, description: "Latitude" },
                        lon: { type: Type.NUMBER, description: "Longitude" },
                    },
                    required: ["lat", "lon"],
                },
            },
        });
        const result = JSON.parse(response.text);
        if (result && typeof result.lat === 'number' && typeof result.lon === 'number') {
            return result;
        }
        return null;
    } catch (error) {
        console.error("Gemini API error (geocodeAddressWithGemini):", error);
        throw new Error("Failed to geocode address.");
    }
};

export const checkForDuplicateReports = async (report: Pick<Report, 'title' | 'description' | 'location' | 'category'>): Promise<Report[]> => {
    const { data, error } = await supabase.from('reports').select('*').neq('status', ReportStatus.Resolved).limit(50);
    if (error || !data || data.length === 0) return [];
    
    const prompt = `
      From the provided list of "Existing Reports", identify up to 3 reports that are highly likely to be duplicates of the "New Report". 
      A duplicate would be about the same issue at the same location.
      Respond ONLY with a JSON array of the IDs of the duplicate reports, like [101, 204]. If there are no obvious duplicates, respond with an empty array [].

      New Report:
      - Title: "${report.title}"
      - Description: "${report.description}"
      - Category: ${report.category}
      - Location: "${report.location}"

      Existing Reports (JSON array):
      ${JSON.stringify(data.map(r => ({ id: r.id, title: r.title, description: r.description, category: r.category, location: r.location })))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        const trimmedResponse = response.text.trim().replace(/```json|```/g, '');
        const duplicateIds = JSON.parse(trimmedResponse);
        return data.filter(r => duplicateIds.includes(r.id));
    } catch (e) {
        console.error("Gemini API error (checkForDuplicateReports):", e);
        return [];
    }
};