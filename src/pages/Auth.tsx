import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";
import backgroundImage from "@/assets/cbmaq-background.png";
import { signInSchema } from "@/lib/validations";
import { z } from "zod";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Validate input
      const validated = signInSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        // Handle specific auth errors with friendly messages
        let errorMessage = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email ainda não confirmado. Verifique sua caixa de entrada.";
        }
        
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: errorMessage,
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro inesperado",
          description: "Tente novamente mais tarde",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="flex min-h-screen items-center justify-center p-8 md:p-16 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'crisp-edges'
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <Card className="w-full max-w-md shadow-2xl relative z-10 bg-background/30 backdrop-blur-sm border border-white/30">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Wrench className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">CBMaq Inspeções</CardTitle>
          <CardDescription>Sistema de Inspeção Técnica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                required
                maxLength={72}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-center text-blue-900 dark:text-blue-400">
              Seus dados estão protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              Ao utilizar este sistema, você está ciente do uso de suas informações para fins de gestão de inspeções técnicas da CBMaq.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
