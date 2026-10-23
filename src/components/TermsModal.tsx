import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsModalProps {
  children: React.ReactNode;
}

const TermsModal = ({ children }: TermsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Termos de Uso — Nacional Rock BR</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <h3 className="text-foreground font-semibold text-base">1. Aceitação dos Termos</h3>
            <p>
              Ao criar uma conta na plataforma Nacional Rock BR, você declara ter lido, compreendido e
              concordado integralmente com estes Termos de Uso. Caso não concorde, não utilize a plataforma.
            </p>

            <h3 className="text-foreground font-semibold text-base">2. Cadastro e Conta</h3>
            <p>
              O usuário é responsável por fornecer informações verdadeiras durante o cadastro e por manter a
              segurança de suas credenciais de acesso. Cada pessoa ou banda deve possuir apenas uma conta.
            </p>

            <h3 className="text-foreground font-semibold text-base">3. Moderação e Acesso Administrativo</h3>
            <p>
              Para fins de <strong>moderação e segurança da comunidade</strong>, os administradores da
              plataforma possuem acesso a dados públicos dos perfis e ao conteúdo de chats e publicações. Esse
              acesso é utilizado exclusivamente para garantir o cumprimento das regras da plataforma, coibir
              abusos, fraudes e conteúdo ilegal.
            </p>

            <h3 className="text-foreground font-semibold text-base">4. Segurança de Senhas</h3>
            <p>
              As senhas dos usuários são <strong>criptografadas</strong> utilizando algoritmos seguros de
              hash e <strong>não são acessíveis aos administradores</strong> ou a qualquer pessoa. Nenhum
              membro da equipe jamais solicitará sua senha.
            </p>

            <h3 className="text-foreground font-semibold text-base">5. Loja e Taxa de Manutenção</h3>
            <p>
              A plataforma oferece um marketplace para bandas venderem produtos. A taxa de{" "}
              <strong>R$&nbsp;10,00 para cada 20 slots de produtos</strong> na loja é uma{" "}
              <strong>contribuição de manutenção</strong> destinada a cobrir custos operacionais da
              plataforma, incluindo infraestrutura, armazenamento e suporte técnico.
            </p>

            <h3 className="text-foreground font-semibold text-base">6. Conteúdo do Usuário</h3>
            <p>
              O usuário é responsável por todo conteúdo que publica. Conteúdos que violem leis, incitem ódio
              ou infrinjam direitos autorais poderão ser removidos sem aviso prévio, e a conta poderá ser
              suspensa.
            </p>

            <h3 className="text-foreground font-semibold text-base">7. Processamento de Dados</h3>
            <p>
              Ao utilizar a plataforma, você autoriza o processamento dos seus dados conforme a política de
              privacidade. Os dados são utilizados para funcionamento da plataforma, personalização da
              experiência e comunicação relevante. Não compartilhamos dados pessoais com terceiros para fins
              comerciais.
            </p>

            <h3 className="text-foreground font-semibold text-base">8. Alterações nos Termos</h3>
            <p>
              A plataforma se reserva o direito de alterar estes termos a qualquer momento, notificando os
              usuários sobre mudanças significativas. O uso continuado após alterações constitui aceitação dos
              novos termos.
            </p>

            <h3 className="text-foreground font-semibold text-base">9. Contato</h3>
            <p>
              Dúvidas sobre estes termos podem ser enviadas através dos canais oficiais da plataforma.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
