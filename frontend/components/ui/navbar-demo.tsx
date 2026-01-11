import { Home, User, Briefcase, FileText, CreditCard, Shield, HelpCircle, MessageCircle } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"

export function NavBarDemo() {
  const navItems = [
    { name: 'Pricing', url: '/pricing', icon: CreditCard },
    { name: 'How it works', url: '/how-it-works', icon: Briefcase },
    { name: 'Trust & Safety', url: '/trust', icon: Shield },
    { name: 'About', url: '/about', icon: User },
    { name: 'Support', url: '/contact', icon: MessageCircle }
  ]

  return <NavBar items={navItems} />
}
