"""
Curated, Customizable Starter Roadmap Templates for All 5 Study Paths:
1. FULL_STACK: Full Stack Web Development
2. SSC: SSC CGL, CHSL & Central Exams Preparation
3. RAILWAY: Indian Railways (RRB NTPC, Group D, ALP)
4. JEE: Joint Entrance Examination (Engineering)
5. NEET: National Eligibility cum Entrance Test (Medical)
"""

ROADMAP_TEMPLATES = {
    "FULL_STACK": {
        "title": "Full Stack Software Engineering Roadmap",
        "description": "Comprehensive full stack curriculum covering frontend, backend, databases, REST APIs, authentication, testing, and system design.",
        "phases": [
            {
                "title": "Phase 1: HTML5 & Modern CSS3 Fundamentals",
                "description": "Master clean semantic markup, CSS Box Model, Flexbox layouts, CSS Grid, and responsive design systems.",
                "sequence_number": 1,
                "items": [
                    {"title": "Semantic HTML5 Markup & SEO Tags", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://developer.mozilla.org/en-US/docs/Web/HTML"},
                    {"title": "CSS3 Flexbox Layout Mastery", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://css-tricks.com/snippets/css/a-guide-to-flexbox/"},
                    {"title": "CSS Grid Systems & Responsive Breakpoints", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://css-tricks.com/snippets/css/complete-guide-grid/"},
                    {"title": "CSS Custom Properties & Dark Mode Architecture", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 60, "resource_url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties"}
                ]
            },
            {
                "title": "Phase 2: JavaScript ES6+ & Asynchronous Programming",
                "description": "Deep dive into modern JavaScript, closures, prototypes, Event Loop, Promises, and Fetch API.",
                "sequence_number": 2,
                "items": [
                    {"title": "ES6+ Syntax: Destructuring, Spread, Arrow Functions", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://javascript.info/"},
                    {"title": "DOM Manipulation, Events & Bubbling", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://javascript.info/document"},
                    {"title": "Asynchronous JavaScript: Promises & Async/Await", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 150, "resource_url": "https://javascript.info/async"},
                    {"title": "Fetch API, Error Handling & REST Communication", "subject": "Frontend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API"}
                ]
            },
            {
                "title": "Phase 3: Python Programming & Backend Architecture",
                "description": "Object-oriented Python, virtual environments, type annotations, and backend fundamentals.",
                "sequence_number": 3,
                "items": [
                    {"title": "Python 3 OOP, Decorators & Type Hinting", "subject": "Backend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://docs.python.org/3/tutorial/"},
                    {"title": "Virtual Environments, PIP & Project Modularization", "subject": "Backend", "item_type": "topic", "estimated_minutes": 60, "resource_url": "https://docs.python.org/3/library/venv.html"},
                    {"title": "Client-Server Model, HTTP Protocol & Status Codes", "subject": "Backend", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://developer.mozilla.org/en-US/docs/Web/HTTP"}
                ]
            },
            {
                "title": "Phase 4: FastAPI REST API Development",
                "description": "Build high-performance REST APIs with FastAPI, Pydantic schemas, and dependency injection.",
                "sequence_number": 4,
                "items": [
                    {"title": "FastAPI Route Handlers, Path & Query Parameters", "subject": "Backend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://fastapi.tiangolo.com/tutorial/"},
                    {"title": "Pydantic v2 Request & Response Validation Schemas", "subject": "Backend", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://docs.pydantic.dev/"},
                    {"title": "FastAPI Dependency Injection (`Depends`) System", "subject": "Backend", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://fastapi.tiangolo.com/tutorial/dependencies/"}
                ]
            },
            {
                "title": "Phase 5: Relational Databases & SQLAlchemy ORM",
                "description": "Relational data modeling, SQL queries, indexing, and SQLAlchemy ORM integrations.",
                "sequence_number": 5,
                "items": [
                    {"title": "Relational Schema Design & 1-to-Many Relationships", "subject": "Database", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://www.postgresql.org/docs/"},
                    {"title": "SQLAlchemy 2.0 Declarative Models & Engine Config", "subject": "Database", "item_type": "topic", "estimated_minutes": 150, "resource_url": "https://docs.sqlalchemy.org/en/20/"},
                    {"title": "Database Transactions, Migrations & Performance", "subject": "Database", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://docs.sqlalchemy.org/en/20/orm/session_basics.html"}
                ]
            },
            {
                "title": "Phase 6: Authentication & Security (JWT & Bcrypt)",
                "description": "Secure user registration, password hashing with bcrypt, JWT Bearer tokens, and multi-user isolation.",
                "sequence_number": 6,
                "items": [
                    {"title": "Password Hashing with Bcrypt & Salt Rounds", "subject": "Security", "item_type": "topic", "estimated_minutes": 90, "resource_url": "https://pypi.org/project/bcrypt/"},
                    {"title": "JWT Token Generation, Claims & Expiration", "subject": "Security", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://jwt.io/introduction"},
                    {"title": "FastAPI Security Bearer Header Authentication", "subject": "Security", "item_type": "topic", "estimated_minutes": 120, "resource_url": "https://fastapi.tiangolo.com/tutorial/security/"}
                ]
            },
            {
                "title": "Phase 7: Full-Stack Integration & Production Deployment",
                "description": "Connecting Vanilla JS frontend with FastAPI backend, CORS setup, and live cloud deployment.",
                "sequence_number": 7,
                "items": [
                    {"title": "End-to-End Frontend State Management & API Sync", "subject": "Project", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "CORS Middleware & Production Environment Variables", "subject": "DevOps", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Deployment on Render / Railway / Vercel with HTTPS", "subject": "DevOps", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 8: Interview Preparation & Portfolio Building",
                "description": "Technical interview drills, data structures fundamentals, and portfolio presentation.",
                "sequence_number": 8,
                "items": [
                    {"title": "Top 25 Full-Stack Viva & Technical Questions", "subject": "Interview", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "System Design Basics: REST, Caching & Scaling", "subject": "Interview", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "GitHub Portfolio Showcase & Documentation", "subject": "Project", "item_type": "topic", "estimated_minutes": 90, "resource_url": None}
                ]
            }
        ]
    },

    "SSC": {
        "title": "SSC CGL & Central Exam Comprehensive Track",
        "description": "Structured syllabus covering Quantitative Aptitude, Logical Reasoning, English Comprehension, General Awareness, and Mock Test series.",
        "phases": [
            {
                "title": "Phase 1: Quantitative Aptitude — Arithmetic Foundation",
                "description": "Master high-weightage arithmetic topics, percentage tricks, and ratio calculation methods.",
                "sequence_number": 1,
                "items": [
                    {"title": "Percentages, Fractions & Quick Calculation Shortcuts", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Profit, Loss & Discount Formulas & Problem Sets", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Ratio, Proportion & Mixture-Alligation Concepts", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Time, Speed, Distance & Train Problems", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Time and Work & Pipes-Cisterns", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 2: Quantitative Aptitude — Advanced Mathematics",
                "description": "Algebra, Trigonometry, Geometry, and Mensuration 2D/3D problem solving.",
                "sequence_number": 2,
                "items": [
                    {"title": "Algebra: Algebraic Identities & Factorization", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Trigonometry: Heights & Distances and Standard Angles", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Geometry: Triangles, Circles, Tangents & Theorems", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Mensuration 2D & 3D Formulas & Solids", "subject": "Quantitative Aptitude", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 3: General Intelligence & Logical Reasoning",
                "description": "Verbal and non-verbal reasoning accuracy and speed drills.",
                "sequence_number": 3,
                "items": [
                    {"title": "Coding-Decoding & Letter-Number Series", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Blood Relations & Direction Sense Tests", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Syllogisms & Venn Diagrams Mastery", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Non-Verbal: Paper Folding, Mirror Images & Embedded Figures", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None}
                ]
            },
            {
                "title": "Phase 4: English Language & Comprehension",
                "description": "Grammar rules, vocabulary, reading comprehension, and error spotting.",
                "sequence_number": 4,
                "items": [
                    {"title": "120 Grammar Rules: Subject-Verb Agreement, Tenses, Prepositions", "subject": "English", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Active-Passive Voice & Direct-Indirect Speech", "subject": "English", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "High-Frequency Vocab: Synonyms, Antonyms, Idioms & Phrases", "subject": "English", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Cloze Test & Reading Comprehension Strategy", "subject": "English", "item_type": "topic", "estimated_minutes": 90, "resource_url": None}
                ]
            },
            {
                "title": "Phase 5: General Awareness & Static GK",
                "description": "Indian Polity, Modern History, Geography, Economics, and Current Affairs.",
                "sequence_number": 5,
                "items": [
                    {"title": "Indian Constitution: Articles, Amendments & Fundamental Rights", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Modern Indian History & Freedom Struggle", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Physical & Indian Geography Key Facts", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Last 6 Months Current Affairs Monthly Digest", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 6: Previous-Year Questions & Mock Test Series",
                "description": "Timed mock exams, score tracking, error logging, and Tier-1 examination readiness.",
                "sequence_number": 6,
                "items": [
                    {"title": "Past 5-Year SSC CGL Tier-1 Shift Papers", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Full Length 60-Minute CBT Mock Test 1", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 75, "resource_url": None},
                    {"title": "Full Length 60-Minute CBT Mock Test 2", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 75, "resource_url": None},
                    {"title": "Error Analysis, Weak Area Identification & Revision", "subject": "Revision", "item_type": "revision", "estimated_minutes": 120, "resource_url": None}
                ]
            }
        ]
    },

    "RAILWAY": {
        "title": "Indian Railways (RRB NTPC & Group D) Preparation Track",
        "description": "Complete study plan focusing on General Science, Railway Mathematics, Analytical Reasoning, Railway GK, and speed tests.",
        "phases": [
            {
                "title": "Phase 1: General Science (Physics, Chemistry & Biology)",
                "description": "NCERT Class 9th & 10th science concepts, physical laws, formulas, and human physiology.",
                "sequence_number": 1,
                "items": [
                    {"title": "Physics: Units, Motion, Gravitation, Work & Energy", "subject": "General Science", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Physics: Electricity, Magnetism, Sound & Light", "subject": "General Science", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Chemistry: Periodic Table, Acids, Bases & Chemical Reactions", "subject": "General Science", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Biology: Human Organ Systems, Nutrition & Diseases", "subject": "General Science", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 2: RRB Mathematics & Fast Calculation Tricks",
                "description": "BODMAS, Number System, Simplification, Interest, and Speed Calculation drills.",
                "sequence_number": 2,
                "items": [
                    {"title": "BODMAS, Decimals, Fractions & LCM-HCF", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Percentage, Simple & Compound Interest", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Time-Work, Pipes-Cisterns & Time-Distance", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Basic Algebra, Geometry & Trigonometry for RRB", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 3: General Intelligence & Reasoning",
                "description": "Logical deduction, analogy, series, coding, and mathematical operations.",
                "sequence_number": 3,
                "items": [
                    {"title": "Analogies, Alphabetical & Number Series", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Venn Diagrams, Syllogisms & Decision Making", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Coding-Decoding & Mathematical Operations", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Data Interpretation & Conclusions", "subject": "Reasoning", "item_type": "topic", "estimated_minutes": 90, "resource_url": None}
                ]
            },
            {
                "title": "Phase 4: Railway GK, History & Current Affairs",
                "description": "Indian Railways organization, zones, budget, geography, and static GK.",
                "sequence_number": 4,
                "items": [
                    {"title": "Indian Railways History, Zones, Headquarters & Vande Bharat", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 90, "resource_url": None},
                    {"title": "Static GK: Capitals, Currencies, National Parks, Monuments", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Sports, Awards, Books & Authors Recent Updates", "subject": "General Awareness", "item_type": "topic", "estimated_minutes": 90, "resource_url": None}
                ]
            },
            {
                "title": "Phase 5: Previous Year Papers & Full Exam Mocks",
                "description": "Simulated computer-based test papers for RRB NTPC / Group D.",
                "sequence_number": 5,
                "items": [
                    {"title": "RRB NTPC Past 3 Years Real Exam Papers", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 180, "resource_url": None},
                    {"title": "RRB 90-Minute 100-Question Mock Test 1", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 100, "resource_url": None},
                    {"title": "Speed Test: 50 Questions in 30 Minutes Math & Science Drill", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 45, "resource_url": None}
                ]
            }
        ]
    },

    "JEE": {
        "title": "JEE Main & Advanced Engineering Preparation Track",
        "description": "Rigorous conceptual and numerical preparation in Physics, Chemistry, and Mathematics with chapter-wise drills and CBT test series.",
        "phases": [
            {
                "title": "Phase 1: Physics Mechanics & Kinematics",
                "description": "Vectors, 1D/2D Kinematics, Newton's Laws of Motion, Friction, Work-Energy-Power, and Rotational Dynamics.",
                "sequence_number": 1,
                "items": [
                    {"title": "Kinematics 1D & 2D (Projectile & Relative Motion)", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Newton's Laws of Motion, Constraints & Friction", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Work, Energy, Power & Conservation of Momentum", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Rotational Dynamics, Moment of Inertia & Torque", "subject": "Physics", "item_type": "topic", "estimated_minutes": 180, "resource_url": None}
                ]
            },
            {
                "title": "Phase 2: Physical & Inorganic Chemistry Foundation",
                "description": "Atomic Structure, Chemical Bonding, Periodic Table Trends, and Chemical Thermodynamics.",
                "sequence_number": 2,
                "items": [
                    {"title": "Atomic Structure & Quantum Numbers", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Chemical Bonding: VSEPR, Hybridization & MOT", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Thermodynamics & Thermochemistry (Enthalpy, Entropy, Gibbs)", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Chemical Equilibrium & Ionic Equilibrium", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 3: Mathematics — Differential & Integral Calculus",
                "description": "Functions, Limits, Continuity, Differentiation, Definite Integration, and Area under Curves.",
                "sequence_number": 3,
                "items": [
                    {"title": "Functions, Limits, Continuity & Differentiability", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Application of Derivatives: Tangents, Maxima & Minima", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Definite & Indefinite Integration Standard Forms", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Differential Equations & Area Under Curves", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 4: Physics Electrodynamics & Magnetism",
                "description": "Electrostatics, Capacitance, Current Electricity, Magnetic Effects, and EMI/AC.",
                "sequence_number": 4,
                "items": [
                    {"title": "Electrostatics: Coulomb's Law, Field & Gauss's Theorem", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Capacitors & Dielectric Circuits", "subject": "Physics", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Current Electricity & Kirchhoff's Circuit Laws", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Electromagnetic Induction & Alternating Current (AC)", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 5: Organic Chemistry Core & Reactions",
                "description": "GOC, Reaction Mechanisms, Hydrocarbons, Haloalkanes, Oxygen & Nitrogen containing compounds.",
                "sequence_number": 5,
                "items": [
                    {"title": "General Organic Chemistry (GOC) & Isomerism", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Reaction Mechanisms: Nucleophilic & Electrophilic Substitutions", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Aldehydes, Ketones, Carboxylic Acids & Named Reactions", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 180, "resource_url": None}
                ]
            },
            {
                "title": "Phase 6: Mathematics — Algebra, Vectors & Coordinate Geometry",
                "description": "Straight Lines, Conic Sections, Matrices, Determinants, Vectors & 3D Geometry.",
                "sequence_number": 6,
                "items": [
                    {"title": "Coordinate Geometry: Straight Lines, Circles & Parabola", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Vectors & 3D Geometry High-Yield Questions", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Matrices, Determinants & Probability", "subject": "Mathematics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 7: Full CBT Test Series & Final Sprint",
                "description": "3-Hour full syllabus mock tests simulating actual JEE Main environment.",
                "sequence_number": 7,
                "items": [
                    {"title": "JEE Main Full Length 3-Hour CBT Mock Test 1", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 190, "resource_url": None},
                    {"title": "JEE Main Full Length 3-Hour CBT Mock Test 2", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 190, "resource_url": None},
                    {"title": "Formula Revision & Short Notes Drill", "subject": "Revision", "item_type": "revision", "estimated_minutes": 120, "resource_url": None}
                ]
            }
        ]
    },

    "NEET": {
        "title": "NEET UG Medical Preparation Track",
        "description": "Comprehensive NCERT-aligned syllabus covering Human Physiology, Genetics, Plant Kingdom, Organic Chemistry, and Optics/Physics.",
        "phases": [
            {
                "title": "Phase 1: Biology — Human Physiology & Organ Systems",
                "description": "Digestion, Respiration, Body Fluids & Circulation, Excretion, Locomotion, and Neural Control.",
                "sequence_number": 1,
                "items": [
                    {"title": "Digestive & Respiratory System NCERT Notes", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Circulatory System: Cardiac Cycle & ECG", "subject": "Biology", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Excretory Products & Human Kidney Mechanism", "subject": "Biology", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Neural Control, Coordination & Endocrine Glands", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 2: Biology — Genetics, Molecular Biology & Evolution",
                "description": "Mendelian Genetics, DNA Structure, Replication, Transcription, Translation, and Evolution.",
                "sequence_number": 2,
                "items": [
                    {"title": "Principles of Inheritance & Variation (Mendelian Genetics)", "subject": "Biology", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Molecular Basis of Inheritance: DNA, RNA & Genetic Code", "subject": "Biology", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Biotechnology Principles, Recombinant DNA & Applications", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Evolution Theories & Human Evolution Timeline", "subject": "Biology", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 3: Chemistry — Organic Reactions & Biomolecules",
                "description": "Named organic reactions, Carbonyl compounds, Amines, Biomolecules, and Polymers.",
                "sequence_number": 3,
                "items": [
                    {"title": "GOC, Electrophiles, Nucleophiles & Stability Order", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Aldehydes, Ketones & Carboxylic Acids Conversions", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Organic Compounds Containing Nitrogen (Amines & Diazonium)", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Biomolecules: Carbohydrates, Amino Acids, Proteins & Nucleic Acids", "subject": "Chemistry", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 4: Physics — Mechanics, Optics & Modern Physics",
                "description": "High-yield NEET physics numerical problems, Ray Optics, Wave Optics, and Dual Nature.",
                "sequence_number": 4,
                "items": [
                    {"title": "Laws of Motion, Work-Energy-Power Formulas", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Ray Optics: Mirrors, Lenses, Prism & Optical Instruments", "subject": "Physics", "item_type": "topic", "estimated_minutes": 180, "resource_url": None},
                    {"title": "Wave Optics: Interference, Diffraction & Young's Double Slit", "subject": "Physics", "item_type": "topic", "estimated_minutes": 120, "resource_url": None},
                    {"title": "Modern Physics: Photoelectric Effect, Atoms & Nuclei", "subject": "Physics", "item_type": "topic", "estimated_minutes": 150, "resource_url": None}
                ]
            },
            {
                "title": "Phase 5: Botany — Plant Diversity, Morphology & Physiology",
                "description": "Plant Kingdom, Anatomy, Photosynthesis, Respiration in Plants, and Plant Growth.",
                "sequence_number": 5,
                "items": [
                    {"title": "Plant Kingdom Classification & Life Cycles", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Morphology & Anatomy of Flowering Plants", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Photosynthesis in Higher Plants (C3, C4 Cycles)", "subject": "Biology", "item_type": "topic", "estimated_minutes": 150, "resource_url": None},
                    {"title": "Respiration in Plants & Plant Growth Regulators (Hormones)", "subject": "Biology", "item_type": "topic", "estimated_minutes": 120, "resource_url": None}
                ]
            },
            {
                "title": "Phase 6: Full Syllabus Mock Tests (720 Marks OMR Drills)",
                "description": "3 hours 20 minutes full syllabus timed tests with 200 questions.",
                "sequence_number": 6,
                "items": [
                    {"title": "NEET Full Syllabus 720-Mark Simulation Mock 1", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 200, "resource_url": None},
                    {"title": "NEET Full Syllabus 720-Mark Simulation Mock 2", "subject": "Mock Test", "item_type": "mock", "estimated_minutes": 200, "resource_url": None},
                    {"title": "NCERT Biology Rapid Diagram & Line-by-Line Review", "subject": "Revision", "item_type": "revision", "estimated_minutes": 150, "resource_url": None}
                ]
            }
        ]
    }
}
