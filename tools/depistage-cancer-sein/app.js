let currentStep = 1;
const totalSteps = 3;
let userData = {
    age: 0,
    personalHistory: 'none',
    familyScoreFinal: 0
};
let memberCounter = 0;

// Chargement de la session sauvegardée
function loadProgress() {
    const saved = localStorage.getItem('breastScreening');
    if (saved) {
        const data = JSON.parse(saved);
        if (confirm('Une session en cours a été trouvée. Voulez-vous la reprendre ?')) {
            if (data.age) {
                document.getElementById('age').value = data.age;
                userData.age = data.age;
            }
            if (data.personalHistory) {
                const radio = document.querySelector(`input[name="personal"][value="${data.personalHistory}"]`);
                if (radio) radio.checked = true;
                userData.personalHistory = data.personalHistory;
            }
            currentStep = data.currentStep || 1;
            if (currentStep > 1) {
                document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
                document.getElementById(`step${currentStep}`).classList.add('active');
                updateProgress();
            }
            showToast('Session restaurée avec succès');
        }
    }
}

// Sauvegarde de la progression
function saveProgress() {
    const progress = {
        currentStep: currentStep,
        age: document.getElementById('age').value,
        personalHistory: document.querySelector('input[name="personal"]:checked')?.value || 'none'
    };
    localStorage.setItem('breastScreening', JSON.stringify(progress));
}

// Affichage d'une notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// Mise à jour de la barre de progression
function updateProgress(forceComplete = false) {
    if (forceComplete) {
        document.getElementById('progressBar').style.width = '100%';
        return;
    }
    const progress = ((currentStep - 1) / totalSteps) * 100;
    document.getElementById('progressBar').style.width = progress === 0 ? '5%' : progress + '%';
}

// Ajout d'un membre de la famille
function addFamilyMember() {
    memberCounter++;
    const container = document.getElementById('familyMembers');
    const memberDiv = document.createElement('div');
    memberDiv.className = 'family-member';
    memberDiv.id = 'member-' + memberCounter;

    memberDiv.innerHTML = `
        <div class="family-member-header">
            <span><i class="fa-solid fa-user-injured"></i> Parent #${memberCounter}</span>
            <button class="remove-btn" onclick="removeFamilyMember(${memberCounter})"><i class="fa-solid fa-xmark"></i> Retirer</button>
        </div>
        <div class="family-inputs">
            <div>
                <label>Type d'atteinte</label>
                <select class="cancer-type" onchange="calculateFamilyScore()">
                    <option value="">-- Sélectionner --</option>
                    <option value="brca">Mutation BRCA 1/2 connue</option>
                    <option value="breast_female">Cancer du sein (Femme)</option>
                    <option value="breast_male">Cancer du sein (Homme)</option>
                    <option value="ovary">Cancer de l'ovaire</option>
                </select>
            </div>
            <div>
                <label>Lien de parenté</label>
                <select class="relation-type" onchange="calculateFamilyScore()">
                    <option value="">-- Sélectionner --</option>
                    <optgroup label="1er degré">
                        <option value="1">Mère / Sœur / Fille</option>
                    </optgroup>
                    <optgroup label="2ème degré">
                        <option value="2">Grand-mère / Tante / Nièce</option>
                    </optgroup>
                </select>
            </div>
            <div>
                <label>Âge au diagnostic</label>
                <input type="number" class="age-diagnosis" placeholder="Âge" min="0" max="100" step="1" onchange="calculateFamilyScore()">
            </div>
            <div>
                <label>Branche parentale</label>
                <select class="branch-type" onchange="calculateFamilyScore()">
                    <option value="maternal">Branche Maternelle</option>
                    <option value="paternal">Branche Paternelle</option>
                </select>
            </div>
        </div>
    `;
    container.appendChild(memberDiv);
    saveProgress();
}

function removeFamilyMember(id) {
    document.getElementById('member-' + id).remove();
    calculateFamilyScore();
    saveProgress();
}

function calculateFamilyScore() {
    let scoreMaternal = 0;
    let scorePaternal = 0;
    const members = document.querySelectorAll('.family-member');

    members.forEach(member => {
        const cancerType = member.querySelector('.cancer-type').value;
        const relationDegree = member.querySelector('.relation-type').value;
        const age = parseInt(member.querySelector('.age-diagnosis').value);
        const branch = member.querySelector('.branch-type').value;

        if (!cancerType) return;

        let points = 0;

        if (cancerType === 'brca') {
            points = 5;
        } else if (cancerType === 'breast_male') {
            points = 4;
        } else if (cancerType === 'ovary') {
            points = 3;
        } else if (cancerType === 'breast_female') {
            if (isNaN(age)) return;
            if (relationDegree === "1") { 
                if (age < 30) points = 4;
                else if (age >= 30 && age <= 39) points = 3;
                else if (age >= 40 && age <= 49) points = 2;
                else if (age >= 50 && age <= 70) points = 1;
            } else if (relationDegree === "2") { 
                if (age < 50) points = 1;
                else if (age >= 50 && age <= 70) points = 0.5;
            }
        }

        if (branch === 'maternal') scoreMaternal += points;
        else if (branch === 'paternal') scorePaternal += points;
    });

    const scoreFinal = Math.max(scoreMaternal, scorePaternal);
    
    document.getElementById('scoreMat').textContent = scoreMaternal;
    document.getElementById('scorePat').textContent = scorePaternal;
    document.getElementById('scoreValue').textContent = scoreFinal;
    
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreFinal >= 5) {
        scoreDisplay.setAttribute('data-risk', 'high');
    } else if (scoreFinal >= 3) {
        scoreDisplay.setAttribute('data-risk', 'medium');
    } else {
        scoreDisplay.removeAttribute('data-risk');
    }
    
    userData.familyScoreFinal = scoreFinal;
    saveProgress();
}

function nextStep(step) {
    if (step === 1) {
        const ageInput = document.getElementById('age');
        const age = parseInt(ageInput.value);
        if (isNaN(age) || age < 18 || age > 120) {
            alert("Veuillez entrer un âge valide (nombre entier entre 18 et 120 ans).");
            ageInput.focus();
            return;
        }
        userData.age = age;
        saveProgress();
    }
    
    if (step === 2) {
        const personal = document.querySelector('input[name="personal"]:checked');
        userData.personalHistory = personal ? personal.value : 'none';
        saveProgress();

        if (userData.personalHistory !== 'none') {
            document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
            calculateResults();
            return;
        }
    }

    document.getElementById('step' + step).classList.remove('active');
    currentStep = step + 1;
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
    saveProgress();
}

function prevStep(step) {
    document.getElementById('step' + step).classList.remove('active');
    currentStep = step - 1;
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
    saveProgress();
}

async function calculateResults() {
    const btn = document.getElementById('calculateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> Calcul en cours...';
    btn.disabled = true;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    calculateFamilyScore();
    
    let riskLevel = '';
    let recommendations = [];
    
    if (userData.personalHistory === 'breast_cancer') {
        riskLevel = '⚠️ Risque Élevé : Suivi post-cancer';
        recommendations = [
            'Examen clinique tous les 6 mois pendant 2 ans, puis annuel.',
            'Mammographie annuelle bilatérale (avec ou sans échographie).',
            'Maintien du suivi régulier avec votre oncologue/gynécologue.',
            'Si antécédents familiaux présents, discuter d\'une orientation en oncogénétique.'
        ];
    } else if (userData.personalHistory === 'atypical_hyperplasia') {
        riskLevel = '⚠️ Risque Élevé : Lésion atypique';
        recommendations = [
            'Mammographie (souvent associée à une échographie) annuelle pendant 10 ans.',
            'Examen clinique annuel.',
            'Au-delà de 10 ans, le suivi est à adapter avec le médecin selon l\'âge.'
        ];
    } else if (userData.personalHistory === 'thoracic_radiation') {
        riskLevel = '🔴 Risque Très Élevé : Irradiation thoracique';
        recommendations = [
            'Suivi à débuter 8 ans après la fin de l\'irradiation (pas avant 20 ans).',
            'Examen clinique annuel.',
            'IRM mammaire annuelle.',
            'Mammographie (avec ou sans échographie) annuelle.',
            'Le suivi est recommandé sans limite de durée.'
        ];
    } 
    else {
        if (userData.familyScoreFinal >= 5) {
            riskLevel = '🔴 Risque Très Élevé : Critères génétiques suspectés';
            recommendations = [
                'Consultation d\'oncogénétique fortement recommandée.',
                'Suivi clinique tous les 6 mois dès l\'âge de 20 ans.',
                'Mammographie/Échographie annuelle à débuter 5 ans avant l\'âge de diagnostic le plus jeune dans la famille.',
                'Discuter de l\'intérêt d\'une IRM mammaire avec le spécialiste.'
            ];
        } else if (userData.familyScoreFinal >= 3) {
            riskLevel = '⚠️ Risque Élevé : Antécédents familiaux significatifs';
            recommendations = [
                'Consultation d\'oncogénétique recommandée pour avis.',
                'Examen clinique annuel dès l\'âge de 20 ans.',
                'Mammographie/Échographie annuelle à débuter 5 ans avant l\'âge de diagnostic le plus jeune dans la famille.',
                'Si l\'âge est > 50 ans, intégration au dépistage organisé si pas de suivi spécifique en cours.'
            ];
        } else {
            if (userData.age >= 50 && userData.age <= 74) {
                riskLevel = '✅ Risque Moyen (Standard) : Dépistage Organisé';
                recommendations = [
                    'Mammographie bilatérale tous les 2 ans (invitation par courrier).',
                    'Examen clinique des seins par un médecin ou sage-femme tous les ans.',
                    'Avantage du dépistage organisé : double lecture des radiographies par un second expert.'
                ];
            } else if (userData.age < 50) {
                riskLevel = '✅ Risque Standard : Surveillance habituelle';
                recommendations = [
                    'Palpation mammaire annuelle par un médecin, gynécologue ou sage-femme dès 25 ans.',
                    'Consultation si apparition de symptômes (masse, écoulement, modification de la peau).',
                    'Le dépistage systématique par mammographie n\'est pas justifié avant 50 ans sans facteur de risque.'
                ];
            } else {
                riskLevel = '✅ Risque Standard : Après 74 ans';
                recommendations = [
                    'Le programme de dépistage organisé s\'arrête à 74 ans.',
                    'Examen clinique régulier par le médecin traitant ou gynécologue.',
                    'La poursuite des mammographies est à discuter au cas par cas avec votre médecin.'
                ];
            }
        }
    }

    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById('results').classList.add('active');
    
    const scoreDisplayCircle = document.getElementById('riskScore');
    if (userData.personalHistory !== 'none') {
        scoreDisplayCircle.innerHTML = '<i class="fa-solid fa-notes-medical" style="font-size: 40px;"></i>';
        scoreDisplayCircle.style.background = 'linear-gradient(135deg, var(--warning), #DD6B20)';
    } else {
        scoreDisplayCircle.textContent = userData.familyScoreFinal;
        if (userData.familyScoreFinal >= 5) {
            scoreDisplayCircle.style.background = 'linear-gradient(135deg, var(--danger), #C53030)';
        } else if (userData.familyScoreFinal >= 3) {
            scoreDisplayCircle.style.background = 'linear-gradient(135deg, var(--warning), #DD6B20)';
        } else {
            scoreDisplayCircle.style.background = 'linear-gradient(135deg, var(--primary-color), var(--accent-color))';
        }
    }

    document.getElementById('riskLevel').textContent = riskLevel;

    const recList = document.getElementById('recommendationsList');
    recList.innerHTML = '';
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${rec}</span>`;
        recList.appendChild(li);
    });

    updateProgress(true);
    
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    localStorage.setItem('breastScreening', JSON.stringify({ ...userData, completed: true }));
}

function restart() {
    if (confirm('Voulez-vous vraiment recommencer ? Toutes les données seront effacées.')) {
        currentStep = 1;
        userData = { age: 0, personalHistory: 'none', familyScoreFinal: 0 };
        memberCounter = 0;
        
        document.getElementById('age').value = '';
        document.getElementById('personal1').checked = true;
        document.getElementById('familyMembers').innerHTML = '';
        document.getElementById('scoreMat').textContent = '0';
        document.getElementById('scorePat').textContent = '0';
        document.getElementById('scoreValue').textContent = '0';
        
        const scoreDisplay = document.getElementById('scoreDisplay');
        scoreDisplay.removeAttribute('data-risk');
        
        document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
        document.getElementById('step1').classList.add('active');
        updateProgress();
        
        localStorage.removeItem('breastScreening');
        showToast('Formulaire réinitialisé');
    }
}

window.addEventListener('beforeunload', function (e) {
    const ageInput = document.getElementById('age');
    const hasData = (ageInput && ageInput.value !== '') || 
                    document.querySelector('input[name="personal"]:checked').value !== 'none';
    if (hasData && currentStep < 3 && !localStorage.getItem('breastScreening_completed')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

document.getElementById('age')?.addEventListener('input', () => saveProgress());
document.querySelectorAll('input[name="personal"]').forEach(radio => {
    radio.addEventListener('change', () => saveProgress());
});

updateProgress();
loadProgress();