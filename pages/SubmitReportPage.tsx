import React, { useState, useRef, useEffect } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import { User, Report, ReportCategory } from '../types.ts';
// FIX: Added .ts extension to fix module resolution error.
import * as api from '../services/api.ts';
// FIX: Added .ts extension to fix module resolution error.
import * as db from '../services/db.ts';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
// FIX: Added .tsx extension to fix module resolution error.
import { UploadIcon, MapPinIcon, ArrowLeftIcon, CpuIcon } from '../components/Icons.tsx';
// FIX: Added .tsx extension to fix module resolution error.
import DuplicateReportModal from '../components/DuplicateReportModal.tsx';


interface SubmitReportPageProps {
  currentUser: User;
  onReportSubmitted: () => void;
  onBack: () => void;
}

const SubmitReportPage = ({ currentUser, onReportSubmitted, onBack }: SubmitReportPageProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>(ReportCategory.Other);
  const [location, setLocation] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [etr, setEtr] = useState<string | null>(null);
  const [isGettingEtr, setIsGettingEtr] = useState(false);

  const [duplicateReports, setDuplicateReports] = useState<Report[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Strip the data URL prefix for backend
        setImageData((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
          setLoading(false);
        },
        (err) => {
          setError('Could not get location. Please enter it manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const fetchETR = async () => {
    if (!title || !description || !category || !location) {
      return;
    }
    setIsGettingEtr(true);
    try {
      const estimatedTime = await api.getETR({ title, description, category, location });
      setEtr(estimatedTime);
    } catch (err) {
      setEtr("Could not be estimated.");
    } finally {
      setIsGettingEtr(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        fetchETR();
    }, 1000); // Debounce ETR fetching
    return () => clearTimeout(debounceTimer);
  }, [title, description, category, location]);
  
  const submit = async () => {
    setLoading(true);
    setError('');
    
    const reportData = {
        title,
        description,
        category,
        location,
        image_data: imageData || undefined,
        image_url: imageFile?.name, // For file extension on backend
        submitted_by: currentUser.id,
    };

    try {
        await api.submitReport(reportData);
        alert('Report submitted successfully!');
        onReportSubmitted();
    } catch (err: any) {
        setError(err.message || 'Failed to submit report. It has been saved locally and will be submitted when you are back online.');
        // Save to IndexedDB for offline support
        await db.addPendingReport(reportData);
    } finally {
        setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !category) {
      setError('Please fill out all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
        const duplicates = await api.checkForDuplicateReports({ title, description, location, category });
        if (duplicates.length > 0) {
            setDuplicateReports(duplicates);
            setIsDuplicateModalOpen(true);
        } else {
            await submit();
        }
    } catch (err) {
        // If duplicate check fails, proceed with submission anyway but warn user
        console.error("AI duplicate check failed, submitting directly.", err);
        await submit();
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Submit a New Report</CardTitle>
            <CardDescription>Fill in the details below to report a new civic issue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title">Title</label>
              <Input id="title" placeholder="e.g., Large pothole on Main St" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label htmlFor="description">Description</label>
              <Textarea id="description" placeholder="Provide details about the issue, its size, and specific location." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="category">Category</label>
                    <Select id="category" value={category} onChange={e => setCategory(e.target.value as ReportCategory)} required>
                    {Object.values(ReportCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="location">Location</label>
                    <div className="flex space-x-2">
                        <Input id="location" placeholder="Address or GPS coordinates" value={location} onChange={e => setLocation(e.target.value)} required />
                        <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} aria-label="Get my current location">
                            <MapPinIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label>Image (Optional)</label>
              <div 
                className="flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <UploadIcon className="mx-auto h-8 w-8 mb-2" />
                    <p>Click to upload an image</p>
                    <p className="text-xs">PNG, JPG, or WEBP</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
            
            {etr && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-center">
                        <CpuIcon className="h-6 w-6 text-primary mr-4" />
                        <div>
                            <p className="font-semibold text-sm">AI Estimated Time to Resolution</p>
                            <p className="text-muted-foreground text-sm">{isGettingEtr ? "Calculating..." : etr}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && <p aria-live="assertive" className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="justify-center">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      <DuplicateReportModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirm={submit}
        duplicateReports={duplicateReports}
      />
    </div>
  );
};

export default SubmitReportPage;