import React, { useState } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import * as api from '../services/api.ts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';

interface ContactPageProps {
  onSubmit: () => void;
}

const ContactPage = ({ onSubmit }: ContactPageProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await api.addContactMessage({ name, email, message });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle>Thank You!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your message has been sent. We will get back to you as soon as possible.</p>
            <Button onClick={onSubmit} className="mt-4">Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Have a question or suggestion? Drop us a line.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name">Name</label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="message">Message</label>
              <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ContactPage;