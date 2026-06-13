import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Activity, 
  FileText, 
  AlertTriangle, 
  LineChart, 
  CheckSquare, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '任务管理', icon: Activity, exact: true },
  { path: '/alerts', label: '预警复核', icon: AlertTriangle },
  { path: '/recommendations', label: '推荐中心', icon: Brain },
  { path: '/approvals', label: '审批中心', icon: CheckSquare },
  { path: '/reports', label: '报告中心', icon: FileText },
  { path: '/dashboard', label: '性能看板', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={cn(
        "bg-gradient-to-b from-primary-dark to-primary text-white flex flex-col transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <LineChart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-sm">肿瘤模拟平台</span>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
        
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-white/15 text-white shadow-inner" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-white/10">
          <div className={cn(
            "flex items-center gap-3 px-1 py-2",
            !sidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">张研究员</p>
                <p className="text-xs text-white/60 truncate">系统管理员</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {navItems.find(item => 
                item.exact 
                  ? location.pathname === item.path 
                  : location.pathname.startsWith(item.path)
              )?.label || '肿瘤生长模拟平台'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">研</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
