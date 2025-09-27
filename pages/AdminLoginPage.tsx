import React, { useState } from 'react';
// FIX: Added .ts extension to fix module resolution error.
import * as api from '../services/api.ts';
// FIX: Added .ts extension to fix module resolution error.
import { User, UserRole } from '../types.ts';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface AdminLoginPageProps {
  onLogin: (user: User) => void;
}

const AdminLoginPage = ({ onLogin }: AdminLoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
        const user = await api.loginUser(email, password);
        if (user && user.role === UserRole.Admin) {
          onLogin(user);
        } else {
          setError('Invalid admin credentials.');
        }
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred during login.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
        <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="email-admin">Email</label>
                <Input id="email-admin" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
                <label htmlFor="password-admin">Password</label>
                <Input id="password-admin" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p aria-live="assertive" className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
        </CardFooter>
        </form>
    </Card>
  );
};

export default AdminLoginPage;