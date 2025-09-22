class HUD {
    static setStatus(text) {
        const el = document.getElementById('statusText');
        if (el) el.textContent = text;
    }

    static setStep(stepNumber, state) {
        const step = document.querySelector(`#hud .step[data-step="${stepNumber}"]`);
        if (!step) return;
        ['active','done'].forEach(s => step.classList.remove(s));
        if (state) step.classList.add(state);
    }

    static updateSteps() {
        const steps = document.querySelectorAll('#hud .step');
        steps.forEach((step, index) => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            if (stepNum <= gameState.currentStep) {
                step.classList.add('done');
                if (stepNum === gameState.currentStep) {
                    step.classList.add('active');
                }
            }
        });
    }
}

window.HUD = HUD;

