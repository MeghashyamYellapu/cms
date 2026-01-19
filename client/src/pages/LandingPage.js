import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Smartphone, 
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Play,
  CreditCard,
  Users,
  WifiOff,
  FileSpreadsheet,
  PieChart,
  Download,
  Globe,
  MessageCircle,
  Clock
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // FAQs
  const faqs = [
    {
      q: "Does it work without internet?",
      a: "Yes! The app is designed as a Progressive Web App (PWA). You can collect payments and add customers offline. Data syncs automatically when you're back online."
    },
    {
      q: "Can my customers view their bills?",
      a: "Absolutely. We provide a dedicated Customer Portal where users can login with their phone number to view bill history and current outstanding amounts."
    },
    {
      q: "How secure is my data?",
      a: "We use enterprise-grade encryption. Your data is backed up daily, and we support role-based access control so your staff only sees what they strictly need."
    },
    {
      q: "Can I export my reports?",
      a: "Yes, you can export all your transaction and customer data to Excel formats for offline analysis or accounting purposes."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 scroll-smooth">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Zap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              CableFlow
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">FAQ</a>
            <button 
              onClick={() => navigate('/portal')}
              className="px-5 py-2 text-indigo-600 text-sm font-semibold rounded-full hover:bg-indigo-50 transition-colors border border-indigo-200"
            >
              Customer Portal
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200"
            >
              Console Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-6 absolute w-full shadow-xl animate-in slide-in-from-top-5">
             <div className="flex flex-col gap-4">
                <a href="#features" className="text-base font-medium text-slate-600 py-2" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-base font-medium text-slate-600 py-2" onClick={() => setIsMenuOpen(false)}>How it Works</a>
                <a href="#faq" className="text-base font-medium text-slate-600 py-2" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                <button 
                  onClick={() => { navigate('/portal'); setIsMenuOpen(false); }}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-lg border border-indigo-200"
                >
                   Customer Portal
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                   Login to Console
                </button>
             </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden bg-white">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/80 to-transparent -z-10"></div>
         <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
         <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>

         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> PWA: Works Offline
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                  Manage Your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500">
                     Cable Business.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
                  The all-in-one platform for Cable TV Operators. Generate bills, manage subscriptions, collect payments offline, and give your customers a Self-Service Portal.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                     onClick={() => navigate('/login')}
                     className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                   >
                     Get Started Now <ArrowRight size={20} />
                   </button>
                   <button 
                     onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                     className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                   >
                     Explore Features
                   </button>
                </div>

                <div className="mt-12 flex items-center gap-6">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                        ))}
                    </div>
                    <div>
                        <div className="flex gap-1 text-amber-500 mb-1">
                            {[1,2,3,4,5].map(i => <span key={i}>★</span>)}
                        </div>
                        <p className="text-sm text-slate-600 font-medium">Trusted by Local Operators</p>
                    </div>
                </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl blur-2xl opacity-20 transform rotate-3 scale-95"></div>
                <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670" 
                    alt="Dashboard Preview" 
                    className="relative rounded-3xl shadow-2xl border-4 border-white transform hover:scale-[1.02] transition-transform duration-500"
                />
                
                {/* Floating Card 1 */}
                <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Payment Received</p>
                        <p className="text-lg font-bold text-slate-900">₹650.00</p>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800">
            <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-1">100%</div>
               <div className="text-sm text-slate-400">Uptime</div>
            </div>
            <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">Secure</div>
               <div className="text-sm text-slate-400">Data Encryption</div>
            </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-violet-400 mb-1">24/7</div>
               <div className="text-sm text-slate-400">Support</div>
            </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-1">PWA</div>
               <div className="text-sm text-slate-400">Offline Ready</div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <span className="text-indigo-600 font-bold tracking-wide uppercase text-sm">Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">Everything to Run Your Cable Network</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-lg">Powerful tools built specifically for LCOs to streamline operations.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                 {
                    icon: WifiOff,
                    title: "Offline Mode (PWA)",
                    desc: "No internet? No problem. Collect payments and add customers offline. The app syncs automatically when you reconnect.",
                    color: "bg-rose-500"
                 },
                 {
                    icon: Users,
                    title: "Customer Portal",
                    desc: "Empower your customers to view their billing history, profile, and payment status online with a simple phone number lookup.",
                    color: "bg-blue-500"
                 },
                 {
                    icon: PieChart,
                    title: "Admin Dashboard",
                    desc: "Get a bird's-eye view of your business. Track monthly revenue, outstanding dues, and active connections in real-time.",
                    color: "bg-indigo-500"
                 },
                 {
                    icon: FileSpreadsheet,
                    title: "Excel Reports",
                    desc: "Download detailed transaction and customer reports in Excel format. Perfect for accounting and sharing with partners.",
                    color: "bg-emerald-500"
                 },
                 {
                    icon: Shield,
                    title: "Secure & Private",
                    desc: "Your data is encrypted and secure. We mask sensitive information like Aadhaar numbers to ensure privacy.",
                    color: "bg-violet-500"
                 },
                 {
                    icon: Smartphone,
                    title: "Mobile Friendly",
                    desc: "Manage your business on the go. Our mobile-first design ensures a smooth experience on any device.",
                    color: "bg-amber-500"
                 }
              ].map((feature, i) => (
                 <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
                    <div className={`w-14 h-14 ${feature.color} bg-opacity-10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                       <feature.icon className={feature.color.replace('bg-', 'text-')} size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
               <p className="text-slate-500">Simplify your workflow in three easy steps.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-indigo-100 -z-10"></div>

               {[
                  {
                     title: "1. Add Customers",
                     desc: "Register your customers with their details, STB ID, and package information.",
                     icon: Users
                  },
                  {
                     title: "2. Generate Bills",
                     desc: "Auto-generate monthly bills for all active customers with a single click system.",
                     icon: FileSpreadsheet
                  },
                  {
                     title: "3. Collect & Track",
                     desc: "Record payments (online or cash), print receipts, and track outstandings.",
                     icon: CheckCircle
                  }
               ].map((step, i) => (
                  <div key={i} className="text-center relative">
                     <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                        <step.icon className="text-indigo-600" size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                     <p className="text-slate-500 max-w-xs mx-auto">{step.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50">
         <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
               {faqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                     <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-3">
                        <MessageCircle className="text-indigo-500 shrink-0 mt-1" size={20} />
                        {faq.q}
                     </h3>
                     <p className="text-slate-600 pl-8">{faq.a}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                     <Zap className="text-indigo-400" size={24} />
                     <span className="text-2xl font-bold text-white">CableFlow</span>
                  </div>
                  <p className="text-slate-400 max-w-sm mb-6">
                     The #1 Cable TV Management Solution. Built for performance, security, and ease of use.
                  </p>
               </div>
               
               <div>
                  <h4 className="text-white font-bold mb-6">Platform</h4>
                  <ul className="space-y-4 text-slate-400">
                     <li><a href="#features" className="hover:text-indigo-400 transition-colors">Features</a></li>
                     <li><a href="/portal" className="hover:text-indigo-400 transition-colors">Customer Portal</a></li>
                     <li><a href="/login" className="hover:text-indigo-400 transition-colors">Admin Login</a></li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-white font-bold mb-6">Contact</h4>
                  <ul className="space-y-4 text-slate-400">
                     <li className="flex items-center gap-2"><Globe size={16}/> www.cableflow.in</li>
                     <li className="flex items-center gap-2"><MessageCircle size={16}/> support@cableflow.in</li>
                  </ul>
               </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
               <p>&copy; {new Date().getFullYear()} CableFlow. All rights reserved.</p>
               <p>Made with ❤️ for LCOs</p>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
