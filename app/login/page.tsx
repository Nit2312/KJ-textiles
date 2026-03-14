import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Login | KJ Textile ERP',
  description: 'Sign in to your KJ Textile ERP account',
};

type LoginPageProps = {
  searchParams?: Promise<{
    mode?: string;
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <LoginForm
      initialMode={params?.mode === 'signup' ? 'signup' : 'signin'}
      redirectUrl={params?.redirect || '/dashboard'}
    />
  );
}
