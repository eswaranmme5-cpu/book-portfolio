const GEMINI_API_KEY = "";
const GEMINI_MODEL = "gemini-2.5-flash";

// Reference DOM elements
const prevBtns = document.querySelectorAll(".prev-btn");
const nextBtns = document.querySelectorAll(".next-btn");

// Track all paper elements in the book
const papers = [
    document.querySelector("#p1"),
    document.querySelector("#p2"),
    document.querySelector("#p3"),
    document.querySelector("#p4")
];

let currentLocation = 1;
let numOfPapers = papers.length;
let maxLocation = numOfPapers + 1;

// Stack pages correctly
papers.forEach((paper, index) => {
    paper.style.zIndex = numOfPapers - index;
});

// Event listeners
document.querySelector("#open-btn").addEventListener("click", goNextPage);
document.querySelector(".contact-btn").addEventListener("click", goToContactPage);
nextBtns.forEach(btn => btn.addEventListener("click", goNextPage));
prevBtns.forEach(btn => btn.addEventListener("click", goPrevPage));

// Thank you page button listeners
const primaryBtn = document.querySelector(".primary-btn");
const secondaryBtn = document.querySelector(".secondary-btn");
const contactForm = document.querySelector("#contact-form");
const aiChatToggle = document.querySelector("#ai-chat-toggle");
const aiChatPanel = document.querySelector("#ai-chat-panel");
const aiChatClose = document.querySelector("#ai-chat-close");
const aiChatForm = document.querySelector("#ai-chat-form");
const aiChatInput = document.querySelector("#ai-chat-input");
const aiChatMessages = document.querySelector("#ai-chat-messages");

if (primaryBtn) {
    primaryBtn.addEventListener("click", goToContactPage);
}

if (secondaryBtn) {
    secondaryBtn.addEventListener("click", closeBook);
}

if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.querySelector("#name")?.value.trim() || "";
        const email = document.querySelector("#email")?.value.trim() || "";
        const message = document.querySelector("#message")?.value.trim() || "";

        const gmailUrl = new URL("https://mail.google.com/mail/");
        gmailUrl.search = new URLSearchParams({
            view: "cm",
            fs: "1",
            to: "eswaranmme5@gmail.com",
            su: `Portfolio Contact from ${name}`,
            body: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        }).toString();

        window.open(gmailUrl.toString(), "_blank", "noopener,noreferrer");
    });
}

function toggleAiChat(isOpen) {
    aiChatPanel.hidden = !isOpen;
    aiChatToggle.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) aiChatInput.focus();
}

if (aiChatToggle && aiChatPanel && aiChatClose && aiChatForm) {
    aiChatToggle.addEventListener("click", () => toggleAiChat(true));
    aiChatClose.addEventListener("click", () => toggleAiChat(false));

    aiChatForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const question = aiChatInput.value.trim();
        if (!question) return;

        const userMessage = document.createElement("p");
        userMessage.className = "ai-message ai-message-user";
        userMessage.textContent = question;
        aiChatMessages.appendChild(userMessage);

        const botMessage = document.createElement("p");
        botMessage.className = "ai-message ai-message-bot";
        botMessage.textContent = await getAiReply(question);
        aiChatMessages.appendChild(botMessage);

        aiChatInput.value = "";
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    });
}

async function getAiReply(question) {
    if (GEMINI_API_KEY.trim()) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{
                                text: "You are Mouse, Eswaran M's portfolio assistant. Answer questions about his portfolio using only these facts: he is a Web Developer; skills include HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra, and Docker; his latest project is Pharmacare, an online medicine ordering system; he interned at Saiket Systems from September to October 2025; he is pursuing an MCA at E.G.S. Pillay Engineering College from 2025 to 2027; he completed a Bachelor of Computer Science at E.G.S. Pillay Arts and Science College from 2022 to 2025; contact email is eswaranmme5@gmail.com. Be concise and helpful."
                            }]
                        },
                        contents: [{ parts: [{ text: question }] }]
                    })
                }
            );

            if (!response.ok) throw new Error("Gemini request failed");

            const data = await response.json();
            const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (geminiReply) return geminiReply;
        } catch (error) {
            console.error("Gemini AI is unavailable; using the local assistant.", error);
        }
    }

    return getLocalAiReply(question);
}

function getLocalAiReply(question) {
    const lowerQuestion = question.toLowerCase();
    const language = detectLanguage(lowerQuestion);
    const intents = {
        assistant: ["what's your name", "what is your name", "your name", "who are you", "who is this", "mouse", "உங்கள் பெயர்", "உங்க பெயர்", "आपका नाम", "tu nombre", "votre nom"],
        boss: ["who is eswaran", "who's eswaran", "about eswaran", "eswaran யார்", "eswaran कौन", "quién es eswaran", "qui est eswaran"],
        name: ["eswaran name", "eswaran's name", "his name", "owner name", "பெயர்", "peyar", "peru", "ungala peru", "naam", "नाम", "nombre", "nom"],
        role: ["role", "job", "developer", "profession", "வேலை", "velai", "काम", "kaam", "trabajo", "métier"],
        skills: ["skill", "technology", "tech", "stack", "திறமை", "thiramai", "தொழில்நுட்ப", "कौशल", "kaushal", "tecnología", "compétence"],
        project: ["project", "pharma", "pharmacare", "திட்டம்", "thittam", "प्रोजेक्ट", "proyecto", "projet"],
        experience: ["experience", "work", "intern", "வேலை அனுபவம்", "velai anubavam", "अनुभव", "anubhav", "experiencia", "expérience"],
        education: ["education", "study", "degree", "college", "கல்வி", "kalvi", "படிப்பு", "padippu", "शिक्षा", "shiksha", "educación", "études"],
        contact: ["contact", "email", "mail", "reach", "தொடர்பு", "thodarpu", "संपर्क", "sampark", "contacto", "contacter"],
        social: ["linkedin", "github", "instagram", "social", "சமூக", "samuga", "सोशल", "social", "redes"]
    };

    const intent = Object.keys(intents).find((key) =>
        intents[key].some((keyword) => lowerQuestion.includes(keyword))
    );

    const replies = {
        assistant: {
            en: "I'm Mouse.",
            ta: "நான் Mouse, Eswaran-ன் AI assistant. என் boss Eswaran ஒரு Web Developer. அவருடைய portfolio பற்றி நான் சொல்ல முடியும்.",
            hi: "मैं Mouse हूँ, Eswaran का AI assistant। मेरे boss Eswaran Web Developer हैं और मैं उनके portfolio के बारे में बता सकता हूँ।",
            es: "Soy Mouse, el asistente de IA de Eswaran. Mi jefe Eswaran es desarrollador web y puedo contarte sobre su portfolio.",
            fr: "Je suis Mouse, l'assistant IA d'Eswaran. Mon patron Eswaran est développeur web et je peux vous parler de son portfolio."
        },
        boss: {
            en: "Eswaran is my boss. He is a Web Developer who builds responsive, interactive, and modern web applications. I am Mouse, his AI assistant.",
            ta: "Eswaran என் boss. அவர் responsive மற்றும் modern web applications உருவாக்கும் Web Developer. நான் Mouse, அவருடைய AI assistant.",
            hi: "Eswaran मेरे boss हैं। वे responsive और modern web applications बनाने वाले Web Developer हैं। मैं Mouse, उनका AI assistant हूँ।",
            es: "Eswaran es mi jefe. Es desarrollador web y crea aplicaciones modernas, interactivas y responsive. Soy Mouse, su asistente de IA.",
            fr: "Eswaran est mon patron. Il est développeur web et crée des applications modernes, interactives et responsives. Je suis Mouse, son assistant IA."
        },
        name: {
            en: "My boss's name is Eswaran M.",
            ta: "என் boss-ன் பெயர் Eswaran M.",
            hi: "मेरे boss का नाम Eswaran M है।",
            es: "El nombre de mi jefe es Eswaran M.",
            fr: "Mon patron s'appelle Eswaran M."
        },
        role: {
            en: "My boss Eswaran M is a Web Developer who builds responsive, interactive, and modern web applications.",
            ta: "Eswaran M ஒரு Web Developer. அவர் responsive மற்றும் modern web applications உருவாக்குகிறார்.",
            hi: "Eswaran M एक Web Developer हैं और responsive तथा modern web applications बनाते हैं।",
            es: "Eswaran M es desarrollador web y crea aplicaciones modernas, interactivas y responsive.",
            fr: "Eswaran M est développeur web et crée des applications modernes, interactives et responsives."
        },
        skills: {
            en: "Eswaran's skills are HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra, and Docker.",
            ta: "Eswaran-ன் திறமைகள் HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra மற்றும் Docker.",
            hi: "Eswaran की skills HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra और Docker हैं।",
            es: "Las habilidades de Eswaran incluyen HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra y Docker.",
            fr: "Les compétences d'Eswaran incluent HTML5, CSS3, JavaScript, React, Bootstrap, Python, MongoDB, MySQL, Cassandra et Docker."
        },
        project: {
            en: "His latest project is Pharmacare, an online medicine ordering system built with HTML, CSS, JavaScript, React, Node.js, and MongoDB. The source code is on GitHub.",
            ta: "அவரது latest project Pharmacare. இது HTML, CSS, JavaScript, React, Node.js மற்றும் MongoDB பயன்படுத்திய online medicine ordering system.",
            hi: "उनका latest project Pharmacare है, जो HTML, CSS, JavaScript, React, Node.js और MongoDB से बना online medicine ordering system है।",
            es: "Su proyecto más reciente es Pharmacare, un sistema de pedidos de medicamentos creado con HTML, CSS, JavaScript, React, Node.js y MongoDB.",
            fr: "Son dernier projet est Pharmacare, un système de commande de médicaments créé avec HTML, CSS, JavaScript, React, Node.js et MongoDB."
        },
        experience: {
            en: "Eswaran was a Web Development Intern at Saiket Systems from September to October 2025. He also builds independent full-stack projects for freelance and academic work.",
            ta: "Eswaran செப்டம்பர் முதல் அக்டோபர் 2025 வரை Saiket Systems-ல் Web Development Intern ஆக இருந்தார். அவர் freelance மற்றும் academic full-stack projects-யும் உருவாக்குகிறார்.",
            hi: "Eswaran ने सितंबर से अक्टूबर 2025 तक Saiket Systems में Web Development Intern के रूप में काम किया। वे independent full-stack projects भी बनाते हैं।",
            es: "Eswaran fue becario de desarrollo web en Saiket Systems de septiembre a octubre de 2025 y también crea proyectos full-stack independientes.",
            fr: "Eswaran a été stagiaire en développement web chez Saiket Systems de septembre à octobre 2025 et crée aussi des projets full-stack indépendants."
        },
        education: {
            en: "Eswaran is pursuing a Master of Computer Applications at E.G.S. Pillay Engineering College from 2025 to 2027. He completed a Bachelor of Computer Science at E.G.S. Pillay Arts and Science College from 2022 to 2025.",
            ta: "Eswaran E.G.S. Pillay Engineering College-ல் 2025 முதல் 2027 வரை Master of Computer Applications படித்து வருகிறார். 2022 முதல் 2025 வரை Bachelor of Computer Science முடித்தார்.",
            hi: "Eswaran 2025 से 2027 तक E.G.S. Pillay Engineering College में Master of Computer Applications कर रहे हैं। उन्होंने 2022 से 2025 तक Bachelor of Computer Science पूरा किया।",
            es: "Eswaran cursa un Master of Computer Applications en E.G.S. Pillay Engineering College de 2025 a 2027 y completó un Bachelor of Computer Science de 2022 a 2025.",
            fr: "Eswaran prépare un Master of Computer Applications à E.G.S. Pillay Engineering College de 2025 à 2027 et a obtenu un Bachelor of Computer Science de 2022 à 2025."
        },
        contact: {
            en: "You can contact Eswaran by email at eswaranmme5@gmail.com, or use the Contact Me page in this portfolio.",
            ta: "Eswaran-ஐ eswaranmme5@gmail.com என்ற email மூலம் தொடர்பு கொள்ளலாம் அல்லது portfolio-வில் Contact Me பக்கத்தைப் பயன்படுத்தலாம்.",
            hi: "आप Eswaran से eswaranmme5@gmail.com पर email द्वारा संपर्क कर सकते हैं या portfolio के Contact Me page का उपयोग कर सकते हैं।",
            es: "Puedes contactar con Eswaran en eswaranmme5@gmail.com o usar la página Contact Me de este portfolio.",
            fr: "Vous pouvez contacter Eswaran à eswaranmme5@gmail.com ou utiliser la page Contact Me de ce portfolio."
        },
        social: {
            en: "Eswaran is available on LinkedIn, GitHub, and Instagram through the social icons on his profile page."
        }
    };

    const englishReply = intent
        ? replies[intent].en
        : "Ask me about Eswaran's name, role, skills, projects, education, experience, contact, or social profiles in your language.";

    if (intent && replies[intent][language]) return replies[intent][language];
    if (!intent && language === "ta") return "பெயர், திறமைகள், projects, கல்வி, experience அல்லது contact பற்றி கேளுங்கள்.";

    return translateReply(englishReply, language);
}

async function translateReply(reply, language) {
    const languageCodes = {
        ar: "ar", de: "de", it: "it", ja: "ja", ko: "ko", pt: "pt", zh: "zh-CN"
    };
    const targetLanguage = languageCodes[language];
    if (!targetLanguage) return reply;

    try {
        const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(reply)}&langpair=en|${targetLanguage}`;
        const response = await fetch(endpoint);
        if (!response.ok) return reply;
        const data = await response.json();
        return data.responseData?.translatedText || reply;
    } catch (error) {
        return reply;
    }
}

function detectLanguage(question) {
    if (/\p{Script=Devanagari}/u.test(question)) return "hi";
    if (/\p{Script=Tamil}/u.test(question)) return "ta";
    if (/\p{Script=Arabic}/u.test(question)) return "ar";
    if (/\p{Script=Han}/u.test(question)) return "zh";
    if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(question)) return "ja";
    if (/\p{Script=Hangul}/u.test(question)) return "ko";
    if (/(\bmera\b|\baapka\b|\bkaun\b|\bkya\b|\bnaam\b|\bkaushal\b|\banubhav\b)/.test(question)) return "hi";
    if (/(\bunga\b|\bungal[aio]\b|\bpeyar\b|\benn[aau]\b|\bthiramai\b|\bkalvi\b|\bthodarpu\b)/.test(question)) return "ta";
    const languageWords = {
        es: ["nombre", "proyecto", "experiencia", "habilidades", "contacto"],
        fr: ["nom", "projet", "expérience", "compétences", "contacter"],
        pt: ["nome", "projeto", "experiência", "habilidades", "contato"],
        de: ["wie heißt", "projekt", "erfahrung", "fähigkeiten", "kontakt"],
        it: ["nome", "progetto", "esperienza", "competenze", "contatto"]
    };

    for (const [language, words] of Object.entries(languageWords)) {
        if (words.some((word) => question.includes(word))) return language;
    }

    return "en";
}

/* ---------- Responsive book layout ---------- */
const book = document.querySelector(".book");
const PAGE_W = 380;
const PAGE_H = 520;
const SPREAD_MIN_SCALE = 0.6; // below this (portrait phones) show one page at a time
const MAX_SCALE = 1.6;

let isSingle = false;
let viewSide = "left"; // which page is in view when isSingle

function updateLayout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spreadScale = Math.min((vw - 24) / (PAGE_W * 2), (vh - 40) / PAGE_H);
    isSingle = spreadScale < SPREAD_MIN_SCALE;

    const contentW = isSingle ? PAGE_W + 12 : PAGE_W * 2 + 12;
    const bottomSpace = isSingle ? 84 : 44;
    const scale = Math.min((vw - 20) / contentW, (vh - bottomSpace) / (PAGE_H + 10), MAX_SCALE);

    book.style.setProperty("--s", scale.toFixed(3));
    document.body.classList.toggle("single", isSingle);
    applyShift();
}

function applyShift() {
    let shift = "0%"; // closed: centered cover
    if (currentLocation > 1) {
        if (isSingle) shift = viewSide === "left" ? "100%" : "0%";
        else shift = "50%"; // centered spread
    }
    book.style.setProperty("--shift", shift);
}

window.addEventListener("resize", updateLayout);
window.addEventListener("orientationchange", () => setTimeout(updateLayout, 200));

/* ---------- Page turning ---------- */
function goNextPage() {
    if (isSingle && currentLocation > 1 && currentLocation < maxLocation && viewSide === "left") {
        viewSide = "right";
        applyShift();
        return;
    }

    if (currentLocation < maxLocation) {
        const currentPaper = papers[currentLocation - 1];
        const newZ = currentLocation + 1;

        currentPaper.classList.add("flipped");
        setTimeout(() => { currentPaper.style.zIndex = newZ; }, 500);

        currentLocation++;
        viewSide = "left";
    } else if (currentLocation === maxLocation) {
        closeBook();
        return;
    }
    applyShift();
}

function closeBook() {
    papers.forEach(paper => {
        paper.classList.remove("flipped");
        paper.style.transform = "";
    });
    currentLocation = 1;
    viewSide = "left";
    applyShift();

    setTimeout(() => {
        papers.forEach((paper, index) => {
            paper.style.zIndex = numOfPapers - index;
        });
    }, 500);
}

function goToContactPage() {
    while (currentLocation < 4) {
        goNextPage();
    }
    viewSide = "left";
    applyShift();
}

function goPrevPage() {
    if (isSingle && currentLocation > 1 && viewSide === "right") {
        viewSide = "left";
        applyShift();
        return;
    }

    if (currentLocation > 1) {
        if (currentLocation === 2) {
            closeBook();
            return;
        }

        const idx = currentLocation - 2;
        const currentPaper = papers[idx];
        const newZ = numOfPapers - idx;

        currentPaper.classList.remove("flipped");
        currentPaper.style.transform = "";
        setTimeout(() => { currentPaper.style.zIndex = newZ; }, 500);

        currentLocation--;
        viewSide = "right";
    }
    applyShift();
}

/* ---------- Arrows, swipe, keyboard ---------- */
document.querySelector("#nav-next")?.addEventListener("click", goNextPage);
document.querySelector("#nav-prev")?.addEventListener("click", goPrevPage);

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    if (e.target.closest("input, textarea, .ai-chat-panel")) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) goNextPage();
    else goPrevPage();
}, { passive: true });

document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight") goNextPage();
    if (e.key === "ArrowLeft") goPrevPage();
});

updateLayout();