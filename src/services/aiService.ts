import { ethers } from 'ethers';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'malin';
  timestamp: number;
}

class AiService {
  private walletAddress: string | null = null;
  private balance: string = '0';

  constructor() {}

  updateContext(address: string | null, balance: string) {
    this.walletAddress = address;
    this.balance = balance;
  }

  async getResponse(message: string): Promise<string> {
    const lowerMsg = message.toLowerCase();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut')) {
      return "Bonjour ! Je suis Malin, ton assistant IA personnel. Comment puis-je t'aider avec ton portefeuille aujourd'hui ?";
    }

    if (lowerMsg.includes('solde') || lowerMsg.includes('argent') || lowerMsg.includes('combien')) {
      return `Ton solde actuel est de ${this.balance} ETH. C'est un bon début !`;
    }

    if (lowerMsg.includes('adresse') || lowerMsg.includes('address')) {
      return `Ton adresse de portefeuille est : ${this.walletAddress}. Fais attention à qui tu la partages !`;
    }

    if (lowerMsg.includes('bitcoin') || lowerMsg.includes('btc')) {
      return "Le Bitcoin est la reine des cryptomonnaies. Bien que ce portefeuille soit principalement pour Ethereum, c'est toujours bien de surveiller le BTC !";
    }

    if (lowerMsg.includes('ethereum') || lowerMsg.includes('eth')) {
      return "Ethereum est la blockchain que nous utilisons ici. C'est parfait pour les contrats intelligents et les dApps.";
    }

    if (lowerMsg.includes('sécurité') || lowerMsg.includes('security')) {
      return "La sécurité est primordiale. Ne partage jamais ta phrase de récupération (mnémonique) avec personne, même pas moi !";
    }

    if (lowerMsg.includes('investir') || lowerMsg.includes('conseil')) {
      return "Je suis une IA, pas un conseiller financier. Mais la règle d'or est : n'investis jamais plus que ce que tu peux te permettre de perdre.";
    }

    if (lowerMsg.includes('malin')) {
        return "C'est moi ! Malin, l'intelligence artificielle la plus futée du monde crypto. 😎";
    }

    return "C'est une question intéressante. Je suis encore en train d'apprendre, mais je peux t'aider avec ton solde, ton adresse, ou des infos générales sur la crypto.";
  }
}

export const aiService = new AiService();
