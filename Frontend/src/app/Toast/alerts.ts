let toastTimer: number | undefined;

/**
 * Shows a modern theme-matched toast notification at the top-right of the screen.
 */
export function showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    let toast = document.getElementById('_toast') as HTMLDivElement | null;
    
    // Core color tokens matching your theme
    const themeBg = '#212c4d';
    const borderCol = type === 'success' ? '#e3c376' : '#db7352';
    const shadowGlow = type === 'success' ? 'rgba(227,195,118,0.15)' : 'rgba(219,115,82,0.15)';

    if (!toast) {
        toast = document.createElement('div');
        toast.id = '_toast';
        toast.style.cssText = `
            position: fixed; 
            top: 6.5rem; 
            right: 1.5rem; 
            z-index: 99999; 
            pointer-events: none;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
            transform: translateX(120%);
            opacity: 0;
        `;
        document.body.appendChild(toast);
    }

    // Design layout that mimics the clean geometric aesthetic of your cards
    toast.innerHTML = `
        <div class="flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg" 
             style="background-color: ${themeBg}; border-color: ${borderCol}; box-shadow: 0 0 20px ${shadowGlow};">
            <span style="color: ${borderCol}; font-size: 1rem;">⬡</span>
            <span id="_toast-msg" class="font-sans text-xs tracking-wider text-white font-medium"></span>
        </div>
    `;

    // Safely apply message
    const msgSpan = document.getElementById('_toast-msg');
    if (msgSpan) {
        msgSpan.textContent = msg;
    }

    // Trigger sliding animation
    const activeToast = toast;
    activeToast.style.opacity = '1';
    requestAnimationFrame(() => {
        activeToast.style.transform = 'translateX(0%)';
    });

    // Auto-dismiss logic
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
        activeToast.style.transform = 'translateX(120%)';
        activeToast.style.opacity = '0';
    }, 3500);
}

/**
 * Shows a beautiful Promise-based confirmation dialog styled exactly like your Edit Block modal.
 */
export function showPrompt(msg: string): Promise<boolean> {
    return new Promise((resolve) => {
        // Clear old overlays if any
        const existingPrompt = document.getElementById('_prompt-overlay');
        if (existingPrompt) {
            existingPrompt.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = '_prompt-overlay';
        overlay.style.cssText = `
            position: fixed; 
            inset: 0; 
            background: rgba(15, 23, 42, 0.75); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            z-index: 99999; 
            opacity: 0; 
            transition: opacity 0.25s ease;
            backdrop-filter: blur(4px);
        `;

        // The card elements match your exact layout, buttons, border-radius, and font sizes
        overlay.innerHTML = `
            <div id="_prompt-card" class="relative flex flex-col gap-6 bg-[#212c4d] border border-[#374669] p-7 rounded-2xl shadow-2xl max-w-[22rem] w-full mx-4" 
                 style="transform: scale(0.92); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
                
                <!-- Close cross at top right -->
                <button id="_prompt-close" class="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-light focus:outline-none transition-colors">
                    ×
                </button>

                <!-- Custom styled header -->
                <div>
                    <div class="text-[#e3c376] font-sans text-xs font-semibold tracking-wider lowercase">study block</div>
                    <h2 class="text-white text-2xl font-semibold mt-1 tracking-tight leading-tight">Confirm action</h2>
                </div>

                <!-- Content/Body message -->
                <p class="text-slate-300 text-[0.9rem] leading-relaxed font-sans">${msg}</p>

                <!-- Actions styled to mimic "Save changes" & "Cancel" -->
                <div class="flex items-center gap-3 mt-2">
                    <button id="_prompt-yes" class="flex-1 py-3 bg-[#e3c376] hover:bg-[#d8b564] text-[#1e293b] font-semibold rounded-xl text-xs tracking-wider uppercase transition duration-200">
                        Yes, proceed
                    </button>
                    <button id="_prompt-no" class="flex-1 py-3 bg-transparent hover:bg-white/5 text-white font-medium rounded-xl text-xs tracking-wider uppercase border border-dashed border-slate-500 hover:border-slate-400 transition duration-200">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const card = document.getElementById('_prompt-card') as HTMLDivElement | null;

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            if (card) card.style.transform = 'scale(1)';
        });

        // Safe cleanup animation
        const closePrompt = (result: boolean) => {
            overlay.style.opacity = '0';
            if (card) card.style.transform = 'scale(0.92)';
            
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 250);
        };

        const yesBtn = document.getElementById('_prompt-yes');
        const noBtn = document.getElementById('_prompt-no');
        const closeBtn = document.getElementById('_prompt-close');

        yesBtn?.addEventListener('click', () => closePrompt(true));
        noBtn?.addEventListener('click', () => closePrompt(false));
        closeBtn?.addEventListener('click', () => closePrompt(false));

        // Click on background overlay to exit safely
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePrompt(false);
            }
        });
    });
}