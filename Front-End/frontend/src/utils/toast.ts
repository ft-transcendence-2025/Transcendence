// Toast notification utility for professional alerts

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLElement | null = null;

  constructor() {
    this.initContainer();
  }

  private initContainer() {
    if (typeof document === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-20 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(this.container);
  }

  private getToastStyles(type: ToastType): { bgColor: string; icon: string; iconColor: string } {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-600',
          icon: 'check_circle',
          iconColor: 'text-green-200'
        };
      case 'error':
        return {
          bgColor: 'bg-red-600',
          icon: 'error',
          iconColor: 'text-red-200'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-600',
          icon: 'warning',
          iconColor: 'text-yellow-200'
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-600',
          icon: 'info',
          iconColor: 'text-blue-200'
        };
    }
  }

  public show({ message, type = 'info', duration = 4000 }: ToastOptions) {
    if (!this.container) {
      this.initContainer();
    }

    const { bgColor, icon, iconColor } = this.getToastStyles(type);

    const toast = document.createElement('div');
    toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in-right`;
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    toast.innerHTML = `
      <span class="material-symbols-outlined ${iconColor} text-2xl">${icon}</span>
      <p class="flex-1 text-sm font-medium">${message}</p>
      <button class="close-toast material-symbols-outlined text-white/70 hover:text-white text-xl cursor-pointer">close</button>
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const closeBtn = toast.querySelector('.close-toast');
    const removeToast = () => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', removeToast);
    }

    this.container?.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }

  public success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  }

  public error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  }

  public warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }

  public info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  }
}

// Export singleton instance
export const toast = new ToastManager();
