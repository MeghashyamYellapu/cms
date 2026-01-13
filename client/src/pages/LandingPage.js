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
  Users
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 transition-all duration-300">
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
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</a>
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
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50/80 to-transparent -z-10"></div>
         <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
         <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl -z-10"></div>

         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Now Live: WhatsApp Billing
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                  Cable Billing <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500">
                     Reimagined.
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
                  The complete operating system for modern Cable Operators. 
                  Automate collections, manage customers, and scale your business without the chaos.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                     onClick={() => navigate('/login')}
                     className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                   >
                     Get Started <ArrowRight size={20} />
                   </button>
                   <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                     <Play size={20} className="fill-slate-700" /> Watch Demo
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
                        <p className="text-sm text-slate-600 font-medium">Trusted by 500+ Operators</p>
                    </div>
                </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl blur-2xl opacity-20 transform rotate-3 scale-95"></div>
                <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
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
                        <p className="text-lg font-bold text-slate-900">₹1,250.00</p>
                    </div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute -top-8 -right-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce-slow-delay">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-500 uppercase">System Status</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">99.9% Uptime</p>
                </div>
            </div>
         </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800">
            <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-1">10k+</div>
               <div className="text-sm text-slate-400">Total Users</div>
            </div>
            <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">₹5Cr</div>
               <div className="text-sm text-slate-400">Transactions</div>
            </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-violet-400 mb-1">500+</div>
               <div className="text-sm text-slate-400">LCO Clients</div>
            </div>
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-1">24/7</div>
               <div className="text-sm text-slate-400">Active Support</div>
            </div>
         </div>
      </section>

      {/* Features Grid with Images */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to scale</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-lg">Powerful features wrapped in a simple, beautiful interface.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
              {[
                 {
                    icon: Shield,
                    title: "Bank-Grade Security",
                    desc: "Enterprise-level encryption keeps your customer data safe. Automated backups ensure you never lose a record.",
                    color: "bg-blue-500",
                    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1470"
                 },
                 {
                    icon: Smartphone,
                    title: "WhatsApp Integration",
                    desc: "Send PDF bills and receipts directly to customers. Reduce friction and get paid 3x faster.",
                    color: "bg-emerald-500",
                    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1974"
                 },
                 {
                    icon: BarChart3,
                    title: "Smart Analytics",
                    desc: "Visualise your growth. Track revenue, outstanding balance, and customer churn in real-time.",
                    color: "bg-indigo-500",
                    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2670"
                 }
              ].map((feature, i) => (
                 <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
                    <div className="h-48 overflow-hidden relative">
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10"></div>
                        <img src={feature.image} alt={feature.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="p-8">
                        <div className={`w-12 h-12 ${feature.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-6`}>
                           <feature.icon className={feature.color.replace('bg-', 'text-')} size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-slate-900 -z-20"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 -z-10"></div>
         
         {/* Gradient Blobs */}
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>
         <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[100px] -z-10"></div>

         <div className="max-w-4xl mx-auto text-center text-white relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
               Start managing your business <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">like a pro today.</span>
            </h2>
            <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
               Join a community of forward-thinking cable operators. 
               No credit card required for the trial.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button 
                  onClick={() => navigate('/login')}
                  className="px-10 py-5 bg-white text-slate-900 font-bold text-lg rounded-xl shadow-lg hover:bg-indigo-50 transition-all hover:scale-105"
               >
                  Get Started for Free
               </button>
               <button className="px-10 py-5 bg-transparent border border-white/20 text-white font-bold text-lg rounded-xl hover:bg-white/10 transition-all">
                  Contact Sales
               </button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
               <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Zap className="text-white" size={18} />
                     </div>
                     <span className="text-xl font-bold text-slate-900">CableFlow</span>
                  </div>
                  <p className="text-slate-500 max-w-sm leading-relaxed mb-6">
                     Empowering local businesses with enterprise-grade tools. 
                     Made with ❤️ for the Cable TV industry.
                  </p>
                  <div className="flex gap-4">
                     {/* Social Icons Placeholders */}
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors">𝕏</div>
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors">in</div>
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors">fb</div>
                  </div>
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 mb-6">Product</h4>
                  <ul className="space-y-4 text-slate-500">
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Changelog</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Docs</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                  <ul className="space-y-4 text-slate-500">
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
                     <li><a href="#" className="hover:text-indigo-600 transition-colors">Legal</a></li>
                  </ul>
               </div>
            </div>
            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400 text-sm">
               <p>&copy; {new Date().getFullYear()} CableFlow Systems. All rights reserved.</p>
               <div className="flex gap-6 mt-4 md:mt-0">
                  <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
                  <a href="#" className="hover:text-indigo-600">Terms of Service</a>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
