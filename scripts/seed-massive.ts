// Script de seed massif — Catch'Up
// 100 structures, ~700 conseillers, 3500 bénéficiaires avec conversations réalistes
// Usage : npx tsx scripts/seed-massive.ts

const { createClient } = require('@libsql/client')
const bcrypt = require('bcryptjs')

// ── Constantes ─────────────────────────────────────────────────────

const DB_URL = process.env.TURSO_DATABASE_URL || 'file:local.db'
const BATCH_SIZE = 100
const PASSWORD = 'catchup2026'

const STRUCTURE_TYPES: Array<{ type: string; count: number; prefix: string }> = [
  { type: 'mission_locale', count: 40, prefix: 'ml' },
  { type: 'cio', count: 20, prefix: 'cio' },
  { type: 'e2c', count: 15, prefix: 'e2c' },
  { type: 'paio', count: 10, prefix: 'paio' },
  { type: 'fondation', count: 5, prefix: 'fdn' },
  { type: 'association', count: 10, prefix: 'asso' },
]

const CITIES = [
  { ville: 'Paris', dept: '75', region: 'Île-de-France', cp: '75000', lat: 48.8566, lng: 2.3522 },
  { ville: 'Marseille', dept: '13', region: 'PACA', cp: '13000', lat: 43.2965, lng: 5.3698 },
  { ville: 'Lyon', dept: '69', region: 'Auvergne-Rhône-Alpes', cp: '69000', lat: 45.7640, lng: 4.8357 },
  { ville: 'Toulouse', dept: '31', region: 'Occitanie', cp: '31000', lat: 43.6047, lng: 1.4442 },
  { ville: 'Nice', dept: '06', region: 'PACA', cp: '06000', lat: 43.7102, lng: 7.2620 },
  { ville: 'Nantes', dept: '44', region: 'Pays de la Loire', cp: '44000', lat: 47.2184, lng: -1.5536 },
  { ville: 'Strasbourg', dept: '67', region: 'Grand Est', cp: '67000', lat: 48.5734, lng: 7.7521 },
  { ville: 'Montpellier', dept: '34', region: 'Occitanie', cp: '34000', lat: 43.6108, lng: 3.8767 },
  { ville: 'Bordeaux', dept: '33', region: 'Nouvelle-Aquitaine', cp: '33000', lat: 44.8378, lng: -0.5792 },
  { ville: 'Lille', dept: '59', region: 'Hauts-de-France', cp: '59000', lat: 50.6292, lng: 3.0573 },
  { ville: 'Rennes', dept: '35', region: 'Bretagne', cp: '35000', lat: 48.1173, lng: -1.6778 },
  { ville: 'Reims', dept: '51', region: 'Grand Est', cp: '51100', lat: 49.2583, lng: 3.9611 },
  { ville: 'Saint-Étienne', dept: '42', region: 'Auvergne-Rhône-Alpes', cp: '42000', lat: 45.4397, lng: 4.3872 },
  { ville: 'Le Havre', dept: '76', region: 'Normandie', cp: '76600', lat: 49.4944, lng: 0.1079 },
  { ville: 'Toulon', dept: '83', region: 'PACA', cp: '83000', lat: 43.1242, lng: 5.9280 },
  { ville: 'Grenoble', dept: '38', region: 'Auvergne-Rhône-Alpes', cp: '38000', lat: 45.1885, lng: 5.7245 },
  { ville: 'Dijon', dept: '21', region: 'Bourgogne-Franche-Comté', cp: '21000', lat: 47.3220, lng: 5.0415 },
  { ville: 'Angers', dept: '49', region: 'Pays de la Loire', cp: '49000', lat: 47.4784, lng: -0.5632 },
  { ville: 'Nîmes', dept: '30', region: 'Occitanie', cp: '30000', lat: 43.8367, lng: 4.3601 },
  { ville: 'Clermont-Ferrand', dept: '63', region: 'Auvergne-Rhône-Alpes', cp: '63000', lat: 45.7772, lng: 3.0870 },
  { ville: 'Aix-en-Provence', dept: '13', region: 'PACA', cp: '13100', lat: 43.5297, lng: 5.4474 },
  { ville: 'Brest', dept: '29', region: 'Bretagne', cp: '29200', lat: 48.3904, lng: -4.4861 },
  { ville: 'Tours', dept: '37', region: 'Centre-Val de Loire', cp: '37000', lat: 47.3941, lng: 0.6848 },
  { ville: 'Amiens', dept: '80', region: 'Hauts-de-France', cp: '80000', lat: 49.8941, lng: 2.2958 },
  { ville: 'Limoges', dept: '87', region: 'Nouvelle-Aquitaine', cp: '87000', lat: 45.8336, lng: 1.2611 },
  { ville: 'Villeurbanne', dept: '69', region: 'Auvergne-Rhône-Alpes', cp: '69100', lat: 45.7667, lng: 4.8795 },
  { ville: 'Metz', dept: '57', region: 'Grand Est', cp: '57000', lat: 49.1193, lng: 6.1757 },
  { ville: 'Besançon', dept: '25', region: 'Bourgogne-Franche-Comté', cp: '25000', lat: 47.2378, lng: 6.0241 },
  { ville: 'Perpignan', dept: '66', region: 'Occitanie', cp: '66000', lat: 42.6887, lng: 2.8948 },
  { ville: 'Orléans', dept: '45', region: 'Centre-Val de Loire', cp: '45000', lat: 47.9029, lng: 1.9093 },
  { ville: 'Caen', dept: '14', region: 'Normandie', cp: '14000', lat: 49.1829, lng: -0.3707 },
  { ville: 'Mulhouse', dept: '68', region: 'Grand Est', cp: '68100', lat: 47.7508, lng: 7.3359 },
  { ville: 'Rouen', dept: '76', region: 'Normandie', cp: '76000', lat: 49.4432, lng: 1.0993 },
  { ville: 'Nancy', dept: '54', region: 'Grand Est', cp: '54000', lat: 48.6921, lng: 6.1844 },
  { ville: 'Argenteuil', dept: '95', region: 'Île-de-France', cp: '95100', lat: 48.9472, lng: 2.2467 },
  { ville: 'Saint-Denis', dept: '93', region: 'Île-de-France', cp: '93200', lat: 48.9362, lng: 2.3574 },
  { ville: 'Montreuil', dept: '93', region: 'Île-de-France', cp: '93100', lat: 48.8634, lng: 2.4484 },
  { ville: 'Tourcoing', dept: '59', region: 'Hauts-de-France', cp: '59200', lat: 50.7239, lng: 3.1613 },
  { ville: 'Avignon', dept: '84', region: 'PACA', cp: '84000', lat: 43.9493, lng: 4.8055 },
  { ville: 'Dunkerque', dept: '59', region: 'Hauts-de-France', cp: '59140', lat: 51.0343, lng: 2.3768 },
  { ville: 'Poitiers', dept: '86', region: 'Nouvelle-Aquitaine', cp: '86000', lat: 46.5802, lng: 0.3404 },
  { ville: 'Pau', dept: '64', region: 'Nouvelle-Aquitaine', cp: '64000', lat: 43.2951, lng: -0.3708 },
  { ville: 'Calais', dept: '62', region: 'Hauts-de-France', cp: '62100', lat: 50.9513, lng: 1.8587 },
  { ville: 'La Rochelle', dept: '17', region: 'Nouvelle-Aquitaine', cp: '17000', lat: 46.1591, lng: -1.1520 },
  { ville: 'Colmar', dept: '68', region: 'Grand Est', cp: '68000', lat: 48.0794, lng: 7.3584 },
  { ville: 'Ajaccio', dept: '2A', region: 'Corse', cp: '20000', lat: 41.9192, lng: 8.7386 },
  { ville: 'Bastia', dept: '2B', region: 'Corse', cp: '20200', lat: 42.6974, lng: 9.4508 },
  { ville: 'Béziers', dept: '34', region: 'Occitanie', cp: '34500', lat: 43.3449, lng: 3.2151 },
  { ville: 'Bourges', dept: '18', region: 'Centre-Val de Loire', cp: '18000', lat: 47.0810, lng: 2.3988 },
  { ville: 'Chambéry', dept: '73', region: 'Auvergne-Rhône-Alpes', cp: '73000', lat: 45.5646, lng: 5.9178 },
  { ville: 'Chartres', dept: '28', region: 'Centre-Val de Loire', cp: '28000', lat: 48.4561, lng: 1.4841 },
  { ville: 'Cherbourg', dept: '50', region: 'Normandie', cp: '50100', lat: 49.6337, lng: -1.6222 },
  { ville: 'Cholet', dept: '49', region: 'Pays de la Loire', cp: '49300', lat: 47.0605, lng: -0.8784 },
  { ville: 'Épinal', dept: '88', region: 'Grand Est', cp: '88000', lat: 48.1727, lng: 6.4511 },
  { ville: 'Évreux', dept: '27', region: 'Normandie', cp: '27000', lat: 49.0245, lng: 1.1508 },
  { ville: 'Gap', dept: '05', region: 'PACA', cp: '05000', lat: 44.5595, lng: 6.0788 },
  { ville: 'Laval', dept: '53', region: 'Pays de la Loire', cp: '53000', lat: 48.0735, lng: -0.7696 },
  { ville: 'Le Mans', dept: '72', region: 'Pays de la Loire', cp: '72000', lat: 48.0061, lng: 0.1996 },
  { ville: 'Lorient', dept: '56', region: 'Bretagne', cp: '56100', lat: 47.7485, lng: -3.3670 },
  { ville: 'Mâcon', dept: '71', region: 'Bourgogne-Franche-Comté', cp: '71000', lat: 46.3060, lng: 4.8283 },
  { ville: 'Montauban', dept: '82', region: 'Occitanie', cp: '82000', lat: 44.0175, lng: 1.3548 },
  { ville: 'Mont-de-Marsan', dept: '40', region: 'Nouvelle-Aquitaine', cp: '40000', lat: 43.8945, lng: -0.4971 },
  { ville: 'Niort', dept: '79', region: 'Nouvelle-Aquitaine', cp: '79000', lat: 46.3237, lng: -0.4588 },
  { ville: 'Périgueux', dept: '24', region: 'Nouvelle-Aquitaine', cp: '24000', lat: 45.1847, lng: 0.7211 },
  { ville: 'Quimper', dept: '29', region: 'Bretagne', cp: '29000', lat: 47.9960, lng: -4.0961 },
  { ville: 'Rodez', dept: '12', region: 'Occitanie', cp: '12000', lat: 44.3498, lng: 2.5737 },
  { ville: 'Saint-Brieuc', dept: '22', region: 'Bretagne', cp: '22000', lat: 48.5141, lng: -2.7607 },
  { ville: 'Saint-Malo', dept: '35', region: 'Bretagne', cp: '35400', lat: 48.6493, lng: -2.0007 },
  { ville: 'Saint-Nazaire', dept: '44', region: 'Pays de la Loire', cp: '44600', lat: 47.2733, lng: -2.2137 },
  { ville: 'Tarbes', dept: '65', region: 'Occitanie', cp: '65000', lat: 43.2327, lng: 0.0782 },
  { ville: 'Troyes', dept: '10', region: 'Grand Est', cp: '10000', lat: 48.2973, lng: 4.0744 },
  { ville: 'Valence', dept: '26', region: 'Auvergne-Rhône-Alpes', cp: '26000', lat: 44.9334, lng: 4.8924 },
  { ville: 'Vannes', dept: '56', region: 'Bretagne', cp: '56000', lat: 47.6559, lng: -2.7603 },
  { ville: 'Vichy', dept: '03', region: 'Auvergne-Rhône-Alpes', cp: '03200', lat: 46.1277, lng: 3.4262 },
  { ville: 'Angoulême', dept: '16', region: 'Nouvelle-Aquitaine', cp: '16000', lat: 45.6487, lng: 0.1560 },
  { ville: 'Albi', dept: '81', region: 'Occitanie', cp: '81000', lat: 43.9291, lng: 2.1481 },
  { ville: 'Agen', dept: '47', region: 'Nouvelle-Aquitaine', cp: '47000', lat: 44.2033, lng: 0.6166 },
  { ville: 'Aurillac', dept: '15', region: 'Auvergne-Rhône-Alpes', cp: '15000', lat: 44.9261, lng: 2.4458 },
  { ville: 'Auxerre', dept: '89', region: 'Bourgogne-Franche-Comté', cp: '89000', lat: 47.7985, lng: 3.5674 },
  { ville: 'Bayonne', dept: '64', region: 'Nouvelle-Aquitaine', cp: '64100', lat: 43.4929, lng: -1.4748 },
  { ville: 'Belfort', dept: '90', region: 'Bourgogne-Franche-Comté', cp: '90000', lat: 47.6400, lng: 6.8633 },
  { ville: 'Blois', dept: '41', region: 'Centre-Val de Loire', cp: '41000', lat: 47.5861, lng: 1.3359 },
  { ville: 'Bourg-en-Bresse', dept: '01', region: 'Auvergne-Rhône-Alpes', cp: '01000', lat: 46.2056, lng: 5.2251 },
  { ville: 'Carcassonne', dept: '11', region: 'Occitanie', cp: '11000', lat: 43.2130, lng: 2.3491 },
  { ville: 'Châteauroux', dept: '36', region: 'Centre-Val de Loire', cp: '36000', lat: 46.8103, lng: 1.6913 },
  { ville: 'Digne-les-Bains', dept: '04', region: 'PACA', cp: '04000', lat: 44.0930, lng: 6.2360 },
  { ville: 'Foix', dept: '09', region: 'Occitanie', cp: '09000', lat: 42.9657, lng: 1.6078 },
  { ville: 'Guéret', dept: '23', region: 'Nouvelle-Aquitaine', cp: '23000', lat: 46.1722, lng: 1.8719 },
  { ville: 'Lons-le-Saunier', dept: '39', region: 'Bourgogne-Franche-Comté', cp: '39000', lat: 46.6747, lng: 5.5544 },
  { ville: 'Mende', dept: '48', region: 'Occitanie', cp: '48000', lat: 44.5183, lng: 3.4998 },
  { ville: 'Moulins', dept: '03', region: 'Auvergne-Rhône-Alpes', cp: '03000', lat: 46.5643, lng: 3.3327 },
  { ville: 'Nevers', dept: '58', region: 'Bourgogne-Franche-Comté', cp: '58000', lat: 46.9908, lng: 3.1580 },
  { ville: 'Privas', dept: '07', region: 'Auvergne-Rhône-Alpes', cp: '07000', lat: 44.7356, lng: 4.5987 },
  { ville: 'Saint-Lô', dept: '50', region: 'Normandie', cp: '50000', lat: 49.1169, lng: -1.0905 },
  { ville: 'Tulle', dept: '19', region: 'Nouvelle-Aquitaine', cp: '19000', lat: 45.2677, lng: 1.7700 },
  { ville: 'Vesoul', dept: '70', region: 'Bourgogne-Franche-Comté', cp: '70000', lat: 47.6194, lng: 6.1547 },
  { ville: 'Cergy', dept: '95', region: 'Île-de-France', cp: '95000', lat: 49.0363, lng: 2.0763 },
  { ville: 'Évry', dept: '91', region: 'Île-de-France', cp: '91000', lat: 48.6324, lng: 2.4367 },
  { ville: 'Créteil', dept: '94', region: 'Île-de-France', cp: '94000', lat: 48.7909, lng: 2.4554 },
  { ville: 'Nanterre', dept: '92', region: 'Île-de-France', cp: '92000', lat: 48.8925, lng: 2.2069 },
  { ville: 'Bobigny', dept: '93', region: 'Île-de-France', cp: '93000', lat: 48.9097, lng: 2.4384 },
]

const SPECIALTIES: Record<string, string[][]> = {
  mission_locale: [
    ['insertion', 'emploi', 'logement'],
    ['insertion', 'decrochage', 'emploi'],
    ['insertion', 'entrepreneuriat', 'emploi'],
    ['insertion', 'formation', 'mobilite'],
    ['insertion', 'numerique', 'emploi'],
  ],
  cio: [
    ['orientation', 'reorientation', 'lyceen'],
    ['orientation', 'bilan', 'etudiant'],
    ['orientation', 'parcoursup', 'lyceen'],
  ],
  e2c: [
    ['decrochage', 'insertion', 'remobilisation'],
    ['decrochage', 'formation', 'insertion'],
  ],
  paio: [
    ['accueil', 'orientation', 'insertion'],
    ['accueil', 'formation', 'emploi'],
  ],
  fondation: [
    ['orientation', 'innovation', 'numerique'],
    ['recherche', 'orientation', 'evaluation'],
  ],
  association: [
    ['insertion', 'social', 'accompagnement'],
    ['jeunesse', 'emploi', 'culture'],
    ['insertion', 'handicap', 'formation'],
  ],
}

const STREET_NAMES = [
  'rue de la République', 'avenue Victor Hugo', 'boulevard Gambetta', 'rue Jean Jaurès',
  'rue du Commerce', 'place de la Mairie', 'rue Pasteur', 'avenue de la Gare',
  'rue Émile Zola', 'boulevard de la Liberté', 'rue Nationale', 'avenue Foch',
  'rue des Écoles', 'place du Marché', 'rue de la Paix', 'boulevard Saint-Michel',
  'rue Voltaire', 'avenue Carnot', 'rue de Verdun', 'place de la Fontaine',
]

// ── Prénoms français diversifiés ───────────────────────────────────

const PRENOMS_M = [
  'Lucas', 'Enzo', 'Nathan', 'Hugo', 'Louis', 'Mathis', 'Ethan', 'Raphaël', 'Arthur', 'Noah',
  'Jules', 'Tom', 'Adam', 'Léo', 'Théo', 'Gabriel', 'Sacha', 'Maxime', 'Romain', 'Antoine',
  'Kylian', 'Karim', 'Sofiane', 'Mehdi', 'Yanis', 'Bilal', 'Ilyes', 'Ibrahim', 'Omar', 'Moussa',
  'Alexandre', 'Baptiste', 'Clément', 'Damien', 'Émile', 'Florian', 'Guillaume', 'Hadrien', 'Ismaël', 'Julien',
  'Kevin', 'Laurent', 'Mathieu', 'Nicolas', 'Olivier', 'Pierre', 'Quentin', 'Samuel', 'Tristan', 'Vincent',
]

const PRENOMS_F = [
  'Emma', 'Léa', 'Chloé', 'Inès', 'Jade', 'Lina', 'Sarah', 'Louise', 'Manon', 'Camille',
  'Anna', 'Eva', 'Clara', 'Zoé', 'Alice', 'Juliette', 'Amina', 'Fatima', 'Yasmine', 'Nadia',
  'Marie', 'Lucie', 'Rose', 'Élodie', 'Océane', 'Margot', 'Pauline', 'Laura', 'Julie', 'Élise',
  'Charlotte', 'Diane', 'Estelle', 'Florence', 'Gaëlle', 'Hélène', 'Isabelle', 'Jeanne', 'Karine', 'Laetitia',
  'Marion', 'Noémie', 'Ophélie', 'Patricia', 'Rachel', 'Sophie', 'Tiphaine', 'Valérie', 'Wendy', 'Aïcha',
]

const NOMS = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Garnier', 'Chevalier', 'François',
  'Legrand', 'Gauthier', 'Perrin', 'Robin', 'Clément', 'Morin', 'Nicolas', 'Henry', 'Rousseau', 'Mathieu',
  'Benali', 'Diallo', 'Traoré', 'Nguyen', 'Belkacem', 'Kone', 'Bamba', 'Cissé', 'Haddad', 'Bouvier',
]

const PRENOMS_CONS_M = [
  'Jean', 'Pierre', 'Michel', 'Philippe', 'Alain', 'François', 'Patrick', 'Jacques', 'Christophe', 'Sébastien',
  'David', 'Nicolas', 'Thomas', 'Julien', 'Karim', 'Abdel', 'Stéphane', 'Yannick', 'Fabien', 'Marc',
]
const PRENOMS_CONS_F = [
  'Marie', 'Nathalie', 'Sophie', 'Isabelle', 'Sandrine', 'Sylvie', 'Valérie', 'Claire', 'Céline', 'Amina',
  'Fatima', 'Anne', 'Catherine', 'Christine', 'Aurélie', 'Émilie', 'Delphine', 'Laure', 'Caroline', 'Virginie',
]

// ── Conversation Templates ─────────────────────────────────────────

interface ConversationTemplate {
  theme: string
  riasecBase: { r: number; i: number; a: number; s: number; e: number; c: number }
  traits: string[]
  interets: string[]
  forces: string[]
  suggestions: string[]
  messages: Array<{ role: 'user' | 'assistant'; contenu: string }>
}

const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  {
    theme: 'Musique et arts',
    riasecBase: { r: 15, i: 30, a: 85, s: 50, e: 25, c: 10 },
    traits: ['créatif', 'sensible', 'passionné'],
    interets: ['musique', 'composition', 'spectacle vivant'],
    forces: ['expression artistique', 'écoute musicale'],
    suggestions: ['musicien', 'ingénieur du son', 'professeur de musique', 'compositeur', 'régisseur son'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Bienvenue sur Catch'Up. Qu'est-ce qui te passionne dans la vie ?" },
      { role: 'user', contenu: "La musique, clairement. Je joue de la guitare depuis 5 ans et je compose mes propres morceaux." },
      { role: 'assistant', contenu: "Wow, c'est génial ! Tu composes quel style de musique ? Et tu joues seul ou en groupe ?" },
      { role: 'user', contenu: "Du rock et un peu de folk. J'ai un petit groupe avec des potes, on fait des concerts dans des bars." },
      { role: 'assistant', contenu: "Tu as déjà une vraie pratique artistique ! Tu as pensé à en faire ton métier ? Il y a plein de voies possibles." },
      { role: 'user', contenu: "Oui mais mes parents disent que c'est pas un vrai métier... J'hésite entre continuer la musique et faire un truc plus stable." },
      { role: 'assistant', contenu: "Je comprends. Mais il y a des métiers stables dans la musique : ingénieur du son, prof de musique, régisseur... Tu veux qu'on explore ça ensemble ?" },
      { role: 'user', contenu: "Oui carrément ! Ingénieur du son ça me parle bien en fait." },
    ],
  },
  {
    theme: 'Sport et activité physique',
    riasecBase: { r: 70, i: 20, a: 15, s: 55, e: 45, c: 30 },
    traits: ['dynamique', 'compétiteur', 'endurant'],
    interets: ['sport', 'fitness', 'plein air'],
    forces: ['condition physique', 'esprit d\'équipe'],
    suggestions: ['éducateur sportif', 'coach fitness', 'kinésithérapeute', 'moniteur de ski', 'préparateur physique'],
    messages: [
      { role: 'assistant', contenu: "Hey ! Bienvenue. Raconte-moi un peu ce que tu aimes faire de ton temps libre." },
      { role: 'user', contenu: "Le sport ! Je fais du foot en club et de la muscu. Le sport c'est ma vie en fait." },
      { role: 'assistant', contenu: "Cool ! Tu es à quel niveau en foot ? Et la muscu c'est pour le foot ou par passion ?" },
      { role: 'user', contenu: "Niveau régional en foot. La muscu c'est les deux, j'adore aider les autres à progresser aussi." },
      { role: 'assistant', contenu: "Ah intéressant ! Tu aimes transmettre. Tu as pensé à devenir coach sportif ou éducateur sportif ?" },
      { role: 'user', contenu: "Coach sportif oui ! Mais je sais pas quelles études il faut faire." },
    ],
  },
  {
    theme: 'Technologie et gaming',
    riasecBase: { r: 55, i: 75, a: 20, s: 15, e: 30, c: 50 },
    traits: ['logique', 'curieux', 'persévérant'],
    interets: ['jeux vidéo', 'programmation', 'hardware'],
    forces: ['résolution de problèmes', 'pensée analytique'],
    suggestions: ['développeur jeux vidéo', 'game designer', 'administrateur systèmes', 'data analyst', 'testeur QA'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Qu'est-ce qui t'amène sur Catch'Up aujourd'hui ?" },
      { role: 'user', contenu: "Je sais pas trop quoi faire comme métier. J'aime bien les jeux vidéo et l'informatique." },
      { role: 'assistant', contenu: "OK ! Tu joues à quoi ? Et est-ce que tu as déjà touché à la programmation ou au modding ?" },
      { role: 'user', contenu: "Je joue à plein de trucs, FPS et RPG surtout. J'ai commencé à apprendre Python tout seul." },
      { role: 'assistant', contenu: "C'est super que tu apprennes seul ! Le secteur du jeu vidéo recrute beaucoup. Il y a des écoles spécialisées." },
      { role: 'user', contenu: "Ah oui ? Lesquelles ? Je pensais que c'était que pour les génies en maths." },
      { role: 'assistant', contenu: "Pas du tout ! Il y a des BTS, des licences pro, des écoles spécialisées comme l'ENJMIN ou Supinfogame. Tu veux qu'on regarde les fiches métiers ?" },
      { role: 'user', contenu: "Oui trop ! Game designer ça me fait rêver." },
    ],
  },
  {
    theme: 'Animaux et nature',
    riasecBase: { r: 60, i: 50, a: 20, s: 45, e: 10, c: 25 },
    traits: ['patient', 'observateur', 'bienveillant'],
    interets: ['animaux', 'écologie', 'randonnée'],
    forces: ['patience', 'sens de l\'observation'],
    suggestions: ['vétérinaire', 'soigneur animalier', 'garde forestier', 'écologue', 'éducateur canin'],
    messages: [
      { role: 'assistant', contenu: "Bienvenue ! Parle-moi un peu de toi et de ce que tu aimes." },
      { role: 'user', contenu: "J'adore les animaux. J'ai 3 chats et je fais du bénévolat à la SPA le week-end." },
      { role: 'assistant', contenu: "C'est beau cet engagement ! Tu voudrais travailler avec les animaux plus tard ?" },
      { role: 'user', contenu: "Oui ! Mais véto c'est trop long et trop dur pour moi je pense." },
      { role: 'assistant', contenu: "Il y a plein d'autres métiers : soigneur animalier, éducateur canin, auxiliaire vétérinaire. Moins d'études et tout aussi passionnant !" },
      { role: 'user', contenu: "Soigneur animalier ça me plairait trop ! C'est quoi comme formation ?" },
    ],
  },
  {
    theme: 'Cuisine et alimentation',
    riasecBase: { r: 55, i: 20, a: 65, s: 40, e: 45, c: 30 },
    traits: ['créatif', 'minutieux', 'gourmand'],
    interets: ['cuisine', 'pâtisserie', 'gastronomie'],
    forces: ['créativité culinaire', 'précision'],
    suggestions: ['cuisinier', 'pâtissier', 'boulanger', 'diététicien', 'chef de cuisine'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Comment ça va ? Dis-moi ce qui te fait vibrer !" },
      { role: 'user', contenu: "La cuisine ! Je passe mon temps à tester des recettes, j'adore ça." },
      { role: 'assistant', contenu: "Tu cuisines quel type de plats ? Tu as des spécialités ?" },
      { role: 'user', contenu: "Un peu de tout, mais j'adore la pâtisserie. J'ai fait un gâteau 3 étages pour l'anniversaire de ma mère." },
      { role: 'assistant', contenu: "Impressionnant ! La pâtisserie c'est un vrai art. Tu as pensé à un CAP Pâtissier ? C'est une super porte d'entrée." },
      { role: 'user', contenu: "C'est exactement ce que je veux faire ! Mais je sais pas si c'est possible après la 3ème." },
      { role: 'assistant', contenu: "Bien sûr ! Après la 3ème tu peux faire un CAP en 2 ans, en apprentissage c'est encore mieux. On peut chercher les fiches métiers ensemble." },
      { role: 'user', contenu: "Oui je veux bien ! Et l'apprentissage ça veut dire être payé en même temps ?" },
    ],
  },
  {
    theme: 'Aide aux personnes et travail social',
    riasecBase: { r: 10, i: 25, a: 20, s: 85, e: 35, c: 30 },
    traits: ['empathique', 'à l\'écoute', 'patient'],
    interets: ['bénévolat', 'aide sociale', 'accompagnement'],
    forces: ['empathie', 'communication'],
    suggestions: ['éducateur spécialisé', 'assistant social', 'AMP', 'médiateur social', 'animateur socioculturel'],
    messages: [
      { role: 'assistant', contenu: "Bonjour ! Qu'est-ce qui te motive au quotidien ?" },
      { role: 'user', contenu: "Aider les gens. J'ai toujours été celui ou celle à qui on se confie." },
      { role: 'assistant', contenu: "C'est une belle qualité. Tu as des expériences d'aide, de bénévolat ?" },
      { role: 'user', contenu: "Je fais les maraudes avec le Secours Populaire depuis 2 ans et j'accompagne des personnes âgées." },
      { role: 'assistant', contenu: "Tu as un vrai profil social ! Éducateur spécialisé, assistant social, animateur... il y a beaucoup de métiers qui correspondent." },
      { role: 'user', contenu: "Éducateur spécialisé ça m'attire beaucoup. C'est quoi le parcours ?" },
    ],
  },
  {
    theme: 'Science et recherche',
    riasecBase: { r: 30, i: 85, a: 15, s: 20, e: 15, c: 55 },
    traits: ['méthodique', 'curieux', 'rigoureux'],
    interets: ['sciences', 'expériences', 'découverte'],
    forces: ['analyse', 'esprit critique'],
    suggestions: ['chercheur', 'technicien de laboratoire', 'ingénieur R&D', 'pharmacien', 'biochimiste'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Qu'est-ce qui t'intéresse le plus à l'école ou en dehors ?" },
      { role: 'user', contenu: "Les sciences, surtout la biologie et la chimie. J'adore les TP au lycée." },
      { role: 'assistant', contenu: "Un futur scientifique ! Tu préfères la théorie ou la pratique ?" },
      { role: 'user', contenu: "La pratique à fond ! Manipuler, faire des expériences, analyser les résultats." },
      { role: 'assistant', contenu: "Technicien de laboratoire pourrait te plaire alors. Ou ingénieur en R&D si tu veux aller plus loin. Tu connais ces métiers ?" },
      { role: 'user', contenu: "Technicien de labo ça me parle ! C'est quoi comme études ?" },
    ],
  },
  {
    theme: 'Écriture et journalisme',
    riasecBase: { r: 10, i: 50, a: 75, s: 40, e: 35, c: 25 },
    traits: ['curieux', 'expressif', 'analytique'],
    interets: ['écriture', 'actualité', 'réseaux sociaux'],
    forces: ['rédaction', 'esprit de synthèse'],
    suggestions: ['journaliste', 'rédacteur web', 'community manager', 'auteur', 'attaché de presse'],
    messages: [
      { role: 'assistant', contenu: "Hey ! Qu'est-ce que tu aimes faire quand tu as du temps libre ?" },
      { role: 'user', contenu: "Écrire. J'ai un blog et j'écris des nouvelles. Et je suis accro à l'actu." },
      { role: 'assistant', contenu: "Tu as déjà un blog ? C'est super ! Tu écris sur quoi ?" },
      { role: 'user', contenu: "Un peu de tout, des critiques de séries, des reportages sur mon quartier." },
      { role: 'assistant', contenu: "Tu as un profil de journaliste ou rédacteur ! Il y a des formations accessibles après le bac. Ça t'intéresse d'en savoir plus ?" },
      { role: 'user', contenu: "Grave ! Je savais pas qu'il y avait des formations pour ça." },
    ],
  },
  {
    theme: 'Construction et travaux manuels',
    riasecBase: { r: 85, i: 20, a: 25, s: 15, e: 30, c: 40 },
    traits: ['manuel', 'concret', 'résistant'],
    interets: ['bricolage', 'construction', 'rénovation'],
    forces: ['habileté manuelle', 'endurance physique'],
    suggestions: ['maçon', 'électricien', 'plombier', 'charpentier', 'chef de chantier'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Alors, parle-moi de ce que tu aimes faire." },
      { role: 'user', contenu: "J'aime bien bricoler, construire des trucs. J'ai refait la terrasse de mon père cet été." },
      { role: 'assistant', contenu: "La terrasse tout seul ? Chapeau ! Tu aimes le travail en extérieur alors ?" },
      { role: 'user', contenu: "Oui et le travail avec mes mains. L'école c'est pas mon truc mais le concret ça me parle." },
      { role: 'assistant', contenu: "Le BTP recrute énormément et les salaires sont bons. Maçon, électricien, plombier... avec de l'apprentissage tu peux vite devenir autonome." },
      { role: 'user', contenu: "L'apprentissage c'est bien, on est payé et on apprend sur le terrain. Électricien ça me tente." },
    ],
  },
  {
    theme: 'Business et entrepreneuriat',
    riasecBase: { r: 20, i: 35, a: 15, s: 40, e: 80, c: 55 },
    traits: ['ambitieux', 'persuasif', 'leader'],
    interets: ['commerce', 'entrepreneuriat', 'management'],
    forces: ['négociation', 'prise de décision'],
    suggestions: ['commercial', 'chef d\'entreprise', 'manager', 'responsable marketing', 'consultant'],
    messages: [
      { role: 'assistant', contenu: "Bienvenue ! Qu'est-ce qui t'amène ici aujourd'hui ?" },
      { role: 'user', contenu: "Je veux monter ma boîte mais je sais pas par où commencer." },
      { role: 'assistant', contenu: "L'entrepreneuriat, c'est courageux ! Tu as une idée de business ?" },
      { role: 'user', contenu: "Oui, un site e-commerce de vêtements streetwear. J'ai déjà un compte Instagram avec 2000 abonnés." },
      { role: 'assistant', contenu: "Tu as déjà une communauté, c'est un bon début ! Tu connais les dispositifs d'aide à la création d'entreprise pour les jeunes ?" },
      { role: 'user', contenu: "Non pas du tout. Et j'ai besoin d'aide pour le business plan aussi." },
      { role: 'assistant', contenu: "Un conseiller de la Mission Locale peut t'accompagner sur la création d'entreprise. Il y a aussi des aides comme l'ADIE ou les couveuses. On regarde ensemble ?" },
      { role: 'user', contenu: "Oui ! Et si ça marche pas je veux au moins avoir un plan B dans le commerce." },
    ],
  },
  {
    theme: 'Santé et médecine',
    riasecBase: { r: 35, i: 65, a: 10, s: 75, e: 20, c: 40 },
    traits: ['attentif', 'responsable', 'altruiste'],
    interets: ['santé', 'biologie', 'soins'],
    forces: ['attention aux détails', 'calme sous pression'],
    suggestions: ['infirmier', 'aide-soignant', 'ambulancier', 'préparateur en pharmacie', 'orthophoniste'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Dis-moi ce qui te plaît et on va chercher ensemble ta voie." },
      { role: 'user', contenu: "J'aimerais travailler dans le médical. Soigner les gens, c'est ce qui me motive." },
      { role: 'assistant', contenu: "C'est un beau projet ! Tu as une idée précise ou c'est le domaine en général qui t'attire ?" },
      { role: 'user', contenu: "Infirmier ça me plairait bien. Ma tante est infirmière et je trouve ça incroyable ce qu'elle fait." },
      { role: 'assistant', contenu: "L'infirmerie c'est un métier passionnant. Il y a aussi aide-soignant comme première étape si tu veux découvrir le milieu d'abord." },
      { role: 'user', contenu: "Aide-soignant ça peut être bien pour commencer oui. C'est quoi la formation ?" },
    ],
  },
  {
    theme: 'Enseignement et éducation',
    riasecBase: { r: 15, i: 45, a: 30, s: 80, e: 35, c: 40 },
    traits: ['pédagogue', 'patient', 'structuré'],
    interets: ['transmission', 'enfants', 'éducation'],
    forces: ['pédagogie', 'adaptabilité'],
    suggestions: ['professeur des écoles', 'AESH', 'animateur périscolaire', 'formateur', 'éducateur de jeunes enfants'],
    messages: [
      { role: 'assistant', contenu: "Hello ! Qu'est-ce que tu aimes faire ? Raconte-moi !" },
      { role: 'user', contenu: "J'aide mon petit frère avec ses devoirs tous les soirs et j'adore ça. Je donne aussi des cours de soutien." },
      { role: 'assistant', contenu: "Tu aimes transmettre, c'est super ! Tu t'imagines prof plus tard ?" },
      { role: 'user', contenu: "Oui peut-être ! Prof des écoles ça me plairait bien. Ou travailler avec des enfants en difficulté." },
      { role: 'assistant', contenu: "Les deux sont possibles ! Professeur des écoles après un master MEEF, ou éducateur spécialisé pour accompagner les enfants en difficulté." },
      { role: 'user', contenu: "C'est quoi le master MEEF ? C'est long ?" },
    ],
  },
  {
    theme: 'Mode et design',
    riasecBase: { r: 40, i: 20, a: 80, s: 25, e: 45, c: 20 },
    traits: ['esthète', 'créatif', 'tendance'],
    interets: ['mode', 'design', 'tendances'],
    forces: ['sens esthétique', 'créativité visuelle'],
    suggestions: ['styliste', 'designer textile', 'visual merchandiser', 'modéliste', 'directeur artistique'],
    messages: [
      { role: 'assistant', contenu: "Coucou ! Qu'est-ce qui t'inspire au quotidien ?" },
      { role: 'user', contenu: "La mode ! Je dessine mes propres vêtements et j'ai un compte où je poste mes créations." },
      { role: 'assistant', contenu: "Tu crées déjà tes designs ? C'est incroyable ! Tu dessines à la main ou sur ordinateur ?" },
      { role: 'user', contenu: "Les deux ! J'ai appris Illustrator toute seule et je fais des croquis aussi." },
      { role: 'assistant', contenu: "Tu as des compétences techniques en plus de la créativité. Des écoles comme ESMOD ou les BTS Métiers de la mode seraient parfaits pour toi." },
      { role: 'user', contenu: "ESMOD j'en ai entendu parler mais c'est cher non ?" },
    ],
  },
  {
    theme: 'Automobile et mécanique',
    riasecBase: { r: 80, i: 40, a: 10, s: 15, e: 25, c: 45 },
    traits: ['technique', 'méthodique', 'passionné'],
    interets: ['voitures', 'mécanique', 'tuning'],
    forces: ['diagnostic', 'habileté manuelle'],
    suggestions: ['mécanicien auto', 'carrossier', 'technicien maintenance', 'controleur technique', 'vendeur automobile'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Qu'est-ce que tu kiffes dans la vie ?" },
      { role: 'user', contenu: "Les voitures ! Je passe mon temps à regarder des vidéos de mécanique et j'ai retapé un vieux scooter." },
      { role: 'assistant', contenu: "Tu mets déjà les mains dans le cambouis ! Tu préfères la mécanique pure ou la carrosserie ?" },
      { role: 'user', contenu: "La méca ! Comprendre comment ça marche, diagnostiquer les pannes." },
      { role: 'assistant', contenu: "Mécanicien automobile c'est un métier qui recrute beaucoup. En apprentissage tu peux commencer à gagner ta vie rapidement." },
      { role: 'user', contenu: "C'est ce que je veux ! Comment je fais pour trouver un apprentissage ?" },
    ],
  },
  {
    theme: 'Voyage et tourisme',
    riasecBase: { r: 25, i: 30, a: 35, s: 60, e: 55, c: 40 },
    traits: ['ouvert', 'polyglotte', 'adaptable'],
    interets: ['voyages', 'langues', 'cultures'],
    forces: ['adaptabilité', 'sens du contact'],
    suggestions: ['agent de voyage', 'réceptionniste', 'guide touristique', 'steward', 'responsable tourisme'],
    messages: [
      { role: 'assistant', contenu: "Bonjour ! Qu'est-ce que tu aimerais faire plus tard ?" },
      { role: 'user', contenu: "Voyager ! Je rêve de parcourir le monde. J'apprends l'espagnol et le japonais en autodidacte." },
      { role: 'assistant', contenu: "Waouh, tu es motivé ! Le tourisme et l'hôtellerie permettent justement de voyager tout en travaillant." },
      { role: 'user', contenu: "Oui c'est ce que je pensais ! Mais je sais pas quelle formation choisir." },
      { role: 'assistant', contenu: "BTS Tourisme, BTS Hôtellerie, ou même une licence LEA si tu aimes les langues. Et tu peux faire tes stages à l'étranger !" },
      { role: 'user', contenu: "BTS Tourisme ça me parle bien. Et des stages à l'étranger ça serait le rêve." },
    ],
  },
  {
    theme: 'Droit et justice',
    riasecBase: { r: 10, i: 60, a: 15, s: 45, e: 55, c: 70 },
    traits: ['rigoureux', 'éloquent', 'juste'],
    interets: ['droit', 'justice', 'débat'],
    forces: ['argumentation', 'analyse de textes'],
    suggestions: ['avocat', 'juriste', 'greffier', 'médiateur', 'huissier'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Dis-moi ce qui t'intéresse le plus." },
      { role: 'user', contenu: "Le droit et la justice. Je regarde plein de séries juridiques et j'adore débattre." },
      { role: 'assistant', contenu: "Tu aimes argumenter et défendre des idées ! Tu t'imagines avocat ?" },
      { role: 'user', contenu: "Oui mais c'est super long les études de droit non ? Et difficile." },
      { role: 'assistant', contenu: "C'est vrai que c'est exigeant. Mais il y a aussi greffier, médiateur, ou paralégal qui sont plus courts. Et si tu commences en fac de droit, tu verras si ça te plaît." },
      { role: 'user', contenu: "Médiateur ça m'intéresse aussi. Résoudre les conflits c'est un truc que je fais naturellement." },
    ],
  },
  {
    theme: 'Communication et marketing',
    riasecBase: { r: 10, i: 30, a: 55, s: 50, e: 65, c: 35 },
    traits: ['communicatif', 'créatif', 'stratège'],
    interets: ['réseaux sociaux', 'publicité', 'événementiel'],
    forces: ['créativité', 'sens du contact'],
    suggestions: ['community manager', 'chargé de communication', 'chef de projet événementiel', 'graphiste', 'concepteur-rédacteur'],
    messages: [
      { role: 'assistant', contenu: "Hey ! Qu'est-ce que tu aimes et qui te rend unique ?" },
      { role: 'user', contenu: "Je gère le compte Instagram de mon lycée et j'adore créer du contenu. J'ai 5000 abonnés sur mon propre compte." },
      { role: 'assistant', contenu: "5000 abonnés c'est déjà impressionnant ! Tu fais quoi comme contenu ?" },
      { role: 'user', contenu: "Des reels, des stories, un peu de tout. Je fais aussi les affiches des événements du lycée." },
      { role: 'assistant', contenu: "Tu as un vrai profil communication/marketing ! Community manager, chargé de com, graphiste... les possibilités sont nombreuses." },
      { role: 'user', contenu: "Community manager ça me plairait grave ! Ou chargé de com." },
    ],
  },
  {
    theme: 'Agriculture et environnement',
    riasecBase: { r: 70, i: 50, a: 10, s: 30, e: 20, c: 35 },
    traits: ['patient', 'connecté à la nature', 'responsable'],
    interets: ['agriculture', 'écologie', 'jardinage'],
    forces: ['sens de la terre', 'autonomie'],
    suggestions: ['agriculteur', 'paysagiste', 'technicien environnement', 'horticulteur', 'ingénieur agronome'],
    messages: [
      { role: 'assistant', contenu: "Bonjour ! Parle-moi de ce qui te passionne." },
      { role: 'user', contenu: "La nature et l'environnement. J'ai un potager et je m'intéresse à la permaculture." },
      { role: 'assistant', contenu: "La permaculture c'est tendance et écologique ! Tu cultives quoi ?" },
      { role: 'user', contenu: "Tomates, courgettes, herbes aromatiques. Je voudrais en faire mon métier, vivre de la terre." },
      { role: 'assistant', contenu: "Il y a des formations en agriculture bio, en maraîchage, en paysagisme. Tu veux qu'on regarde les fiches métiers ?" },
      { role: 'user', contenu: "Oui ! Maraîcher bio ça me fait rêver. Et paysagiste aussi." },
    ],
  },
  {
    theme: 'Web et développement digital',
    riasecBase: { r: 40, i: 70, a: 45, s: 15, e: 25, c: 50 },
    traits: ['logique', 'autodidacte', 'créatif'],
    interets: ['code', 'web', 'startup'],
    forces: ['pensée logique', 'résolution de problèmes'],
    suggestions: ['développeur web', 'designer UX/UI', 'intégrateur', 'data analyst', 'chef de projet digital'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Qu'est-ce que tu fais en dehors de l'école ?" },
      { role: 'user', contenu: "Je code ! J'ai créé un petit site web pour mon association et j'apprends React." },
      { role: 'assistant', contenu: "React, carrément ! Tu es déjà bien avancé. Tu préfères le côté technique ou le design ?" },
      { role: 'user', contenu: "Un peu les deux. J'aime quand le résultat est beau ET bien codé." },
      { role: 'assistant', contenu: "Tu as un profil full-stack ! Développeur web, UX designer, ou même les deux. Le secteur recrute énormément." },
      { role: 'user', contenu: "Développeur web c'est mon objectif ! Mais je sais pas si je dois aller en fac d'info ou en école." },
      { role: 'assistant', contenu: "Il y a des BTS SIO, des écoles comme 42 (gratuite !), des bootcamps, ou la fac. Chaque chemin a ses avantages. Tu veux qu'on compare ?" },
      { role: 'user', contenu: "42 c'est la fameuse école sans profs ? Ça me tente grave !" },
    ],
  },
  {
    theme: 'Indécis et en exploration',
    riasecBase: { r: 35, i: 35, a: 35, s: 35, e: 30, c: 30 },
    traits: ['hésitant', 'curieux', 'ouvert'],
    interets: ['multiples', 'découverte', 'exploration'],
    forces: ['polyvalence', 'adaptabilité'],
    suggestions: ['service civique', 'stage découverte', 'bilan de compétences', 'formation généraliste'],
    messages: [
      { role: 'assistant', contenu: "Salut ! Bienvenue. Qu'est-ce qui t'amène ici ?" },
      { role: 'user', contenu: "Ben en fait je sais pas du tout quoi faire. J'ai aucune idée de métier." },
      { role: 'assistant', contenu: "C'est normal de ne pas savoir ! On va y aller étape par étape. D'abord, qu'est-ce que tu fais quand tu as du temps libre ?" },
      { role: 'user', contenu: "Euh un peu de tout. Netflix, voir des potes, traîner sur mon tel." },
      { role: 'assistant', contenu: "Et à l'école, il y a des matières que tu préfères ?" },
      { role: 'user', contenu: "Pas vraiment. Peut-être le sport et les SVT c'est pas mal." },
      { role: 'assistant', contenu: "C'est déjà un début ! Sport et SVT montrent que tu aimes le concret et le vivant. Un service civique pourrait t'aider à explorer tes envies." },
      { role: 'user', contenu: "C'est quoi un service civique ? Ça a l'air intéressant." },
    ],
  },
]

// ── Helper functions ───────────────────────────────────────────────

let _counter = 0
function seedId(prefix: string): string {
  _counter++
  return `seed-${prefix}-${String(_counter).padStart(6, '0')}`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysAgo: number): string {
  const ms = Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString()
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function escSql(s: string): string {
  return s.replace(/'/g, "''")
}

// Weighted age distribution (more 17-20)
function randomAge(): number {
  const r = Math.random()
  if (r < 0.05) return 16
  if (r < 0.20) return 17
  if (r < 0.40) return 18
  if (r < 0.60) return 19
  if (r < 0.75) return 20
  if (r < 0.85) return 21
  if (r < 0.92) return 22
  if (r < 0.96) return 23
  if (r < 0.99) return 24
  return 25
}

function randomSituation(): string {
  const r = Math.random()
  if (r < 0.25) return 'lyceen'
  if (r < 0.45) return 'etudiant'
  if (r < 0.65) return 'decrocheur'
  if (r < 0.90) return 'en_recherche'
  return 'salarie'
}

function randomPriorite(): string {
  const r = Math.random()
  if (r < 0.15) return 'critique'
  if (r < 0.45) return 'haute'
  return 'normale'
}

// ── Batch insert helper ────────────────────────────────────────────

async function batchInsert(
  client: ReturnType<typeof createClient>,
  table: string,
  columns: string[],
  rows: string[][],
) {
  if (rows.length === 0) return
  const colStr = columns.join(', ')
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const valuesStr = batch.map(row => `(${row.join(', ')})`).join(',\n')
    await client.execute(`INSERT INTO ${table} (${colStr}) VALUES ${valuesStr}`)
  }
}

function sqlVal(v: string | number | null): string {
  if (v === null) return 'NULL'
  if (typeof v === 'number') return String(v)
  return `'${escSql(String(v))}'`
}

// ── Main seed function ─────────────────────────────────────────────

async function seedMassive() {
  const startTime = Date.now()
  const client = createClient({ url: DB_URL })
  const now = new Date().toISOString()

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║       SEED MASSIF — Catch\'Up               ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  // ═══════════════════════════════════════════════════════════════
  // STEP 0: Drop and recreate all tables
  // ═══════════════════════════════════════════════════════════════
  console.log('[0/7] Suppression et recréation des tables...')

  const tablesToDrop = [
    'rappel', 'enquete_satisfaction',
    'push_subscription',
    'bris_de_glace', 'rendez_vous', 'evenement_journal',
    'demande_consentement', 'participant_conversation', 'tiers_intervenant',
    'message_direct', 'prise_en_charge', 'session_conseiller', 'evenement_audit',
    'code_verification', 'referral', 'indice_confiance', 'profil_riasec',
    'instantane_profil', 'message', 'conversation', 'evenement_quiz',
    'source_captation', 'session_magic_link', 'conseiller', 'structure', 'utilisateur',
  ]
  for (const t of tablesToDrop) {
    await client.execute(`DROP TABLE IF EXISTS ${t}`)
  }

  // Create all tables
  await client.execute(`CREATE TABLE utilisateur (
    id TEXT PRIMARY KEY, prenom TEXT, email TEXT UNIQUE, email_verifie INTEGER DEFAULT 0,
    telephone TEXT, age INTEGER, situation TEXT, code_parrainage TEXT UNIQUE,
    parraine_par TEXT, source TEXT, source_detail TEXT, plateforme TEXT DEFAULT 'web',
    preferences TEXT, cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL,
    mot_de_passe TEXT, session_token TEXT UNIQUE, derniere_visite TEXT, supprime_le TEXT
  )`)
  await client.execute(`CREATE TABLE conversation (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id),
    titre TEXT, statut TEXT DEFAULT 'active', origine TEXT DEFAULT 'direct',
    nb_messages INTEGER DEFAULT 0, phase TEXT DEFAULT 'accroche',
    duree_secondes INTEGER DEFAULT 0, cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE message (
    id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversation(id),
    role TEXT NOT NULL, contenu TEXT NOT NULL, contenu_brut TEXT, url_audio TEXT,
    fragilite_detectee INTEGER DEFAULT 0, niveau_fragilite TEXT,
    profil_extrait INTEGER DEFAULT 0, horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE profil_riasec (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL UNIQUE REFERENCES utilisateur(id),
    r INTEGER DEFAULT 0, i INTEGER DEFAULT 0, a INTEGER DEFAULT 0,
    s INTEGER DEFAULT 0, e INTEGER DEFAULT 0, c INTEGER DEFAULT 0,
    dimensions_dominantes TEXT, traits TEXT, interets TEXT, forces TEXT,
    suggestion TEXT, source TEXT DEFAULT 'conversation', est_stable INTEGER DEFAULT 0,
    coherence_signaux TEXT DEFAULT 'mixte', mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE instantane_profil (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id),
    conversation_id TEXT NOT NULL REFERENCES conversation(id),
    index_message INTEGER NOT NULL, r INTEGER DEFAULT 0, i INTEGER DEFAULT 0,
    a INTEGER DEFAULT 0, s INTEGER DEFAULT 0, e INTEGER DEFAULT 0, c INTEGER DEFAULT 0,
    coherence_signaux TEXT, horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE indice_confiance (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL UNIQUE REFERENCES utilisateur(id),
    score_global REAL DEFAULT 0, niveau TEXT DEFAULT 'debut',
    volume REAL DEFAULT 0, stabilite REAL DEFAULT 0,
    differenciation REAL DEFAULT 0, coherence REAL DEFAULT 0,
    nb_messages INTEGER DEFAULT 0, nb_instantanes INTEGER DEFAULT 0,
    mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE referral (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id),
    conversation_id TEXT NOT NULL REFERENCES conversation(id),
    priorite TEXT NOT NULL, niveau_detection INTEGER NOT NULL,
    motif TEXT, resume_conversation TEXT, moyen_contact TEXT, type_contact TEXT,
    statut TEXT DEFAULT 'en_attente', source TEXT DEFAULT 'generique',
    webhook_envoye INTEGER DEFAULT 0, webhook_reponse TEXT, relance_envoyee INTEGER DEFAULT 0,
    structure_suggeree_id TEXT, localisation TEXT, genre TEXT, age_beneficiaire INTEGER,
    cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL, recontacte_le TEXT
  )`)
  await client.execute(`CREATE TABLE evenement_quiz (
    id TEXT PRIMARY KEY, utilisateur_id TEXT REFERENCES utilisateur(id),
    reponses TEXT NOT NULL, resultat TEXT NOT NULL, duree_ms INTEGER,
    code_parrainage TEXT, source_prescripteur TEXT,
    a_partage INTEGER DEFAULT 0, a_continue_chat INTEGER DEFAULT 0,
    horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE source_captation (
    id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, type TEXT NOT NULL, nom TEXT,
    nb_visites INTEGER DEFAULT 0, nb_quiz_completes INTEGER DEFAULT 0,
    nb_chats_ouverts INTEGER DEFAULT 0, nb_emails_collectes INTEGER DEFAULT 0,
    cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE session_magic_link (
    id TEXT PRIMARY KEY, utilisateur_id TEXT NOT NULL REFERENCES utilisateur(id),
    email TEXT NOT NULL, jeton TEXT NOT NULL UNIQUE,
    utilise INTEGER DEFAULT 0, expire_le TEXT NOT NULL,
    cree_le TEXT NOT NULL, utilise_le TEXT
  )`)
  await client.execute(`CREATE TABLE structure (
    id TEXT PRIMARY KEY, nom TEXT NOT NULL, slug TEXT UNIQUE, type TEXT NOT NULL,
    departements TEXT NOT NULL, regions TEXT, age_min INTEGER DEFAULT 16,
    age_max INTEGER DEFAULT 25, specialites TEXT, genre_preference TEXT,
    capacite_max INTEGER DEFAULT 50, adresse TEXT, code_postal TEXT, ville TEXT,
    latitude REAL, longitude REAL, webhook_url TEXT, parcoureo_id TEXT,
    actif INTEGER DEFAULT 1, cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE conseiller (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, mot_de_passe TEXT,
    prenom TEXT NOT NULL, nom TEXT NOT NULL, role TEXT DEFAULT 'conseiller',
    structure_id TEXT REFERENCES structure(id), parcoureo_id TEXT, actif INTEGER DEFAULT 1,
    derniere_connexion TEXT, cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE prise_en_charge (
    id TEXT PRIMARY KEY, referral_id TEXT NOT NULL REFERENCES referral(id),
    conseiller_id TEXT NOT NULL REFERENCES conseiller(id),
    structure_id TEXT NOT NULL REFERENCES structure(id),
    statut TEXT DEFAULT 'nouvelle', notes TEXT,
    score_matching REAL, raison_matching TEXT, assignee_manuellement INTEGER DEFAULT 0,
    premiere_action_le TEXT, terminee_le TEXT, notification_envoyee INTEGER DEFAULT 0,
    cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE session_conseiller (
    id TEXT PRIMARY KEY, conseiller_id TEXT NOT NULL REFERENCES conseiller(id),
    jeton TEXT NOT NULL UNIQUE, expire_le TEXT NOT NULL,
    revoque INTEGER DEFAULT 0, cree_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE evenement_audit (
    id TEXT PRIMARY KEY, conseiller_id TEXT, action TEXT NOT NULL,
    cible_type TEXT, cible_id TEXT, details TEXT, ip TEXT, horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE message_direct (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    expediteur_type TEXT NOT NULL, expediteur_id TEXT NOT NULL,
    contenu TEXT NOT NULL, conversation_type TEXT DEFAULT 'direct',
    lu INTEGER DEFAULT 0, horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE tiers_intervenant (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    nom TEXT NOT NULL, prenom TEXT NOT NULL, telephone TEXT NOT NULL,
    role TEXT NOT NULL, invite_par_id TEXT NOT NULL REFERENCES conseiller(id),
    statut TEXT DEFAULT 'en_attente', cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE participant_conversation (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    participant_type TEXT NOT NULL, participant_id TEXT NOT NULL,
    actif INTEGER DEFAULT 1, rejoint_le TEXT NOT NULL, quitte_le TEXT
  )`)
  await client.execute(`CREATE TABLE demande_consentement (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    tiers_id TEXT NOT NULL REFERENCES tiers_intervenant(id),
    demandeur_id TEXT NOT NULL, statut TEXT DEFAULT 'en_attente',
    conseiller_approuve INTEGER DEFAULT 0, conseiller_approuve_le TEXT,
    beneficiaire_approuve INTEGER DEFAULT 0, beneficiaire_approuve_le TEXT,
    cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE evenement_journal (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    type TEXT NOT NULL, acteur_type TEXT NOT NULL, acteur_id TEXT NOT NULL,
    cible_type TEXT, cible_id TEXT, resume TEXT, details TEXT,
    horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE rendez_vous (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    titre TEXT NOT NULL, description TEXT, date_heure TEXT NOT NULL,
    duree_minutes INTEGER DEFAULT 30, lieu TEXT, lien_visio TEXT,
    statut TEXT DEFAULT 'planifie', organisateur_type TEXT NOT NULL,
    organisateur_id TEXT NOT NULL, participants TEXT,
    rappel_envoye INTEGER DEFAULT 0, cree_le TEXT NOT NULL, mis_a_jour_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE bris_de_glace (
    id TEXT PRIMARY KEY, conseiller_id TEXT NOT NULL REFERENCES conseiller(id),
    prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    tiers_id TEXT NOT NULL REFERENCES tiers_intervenant(id),
    justification TEXT NOT NULL, ip TEXT, horodatage TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE code_verification (
    id TEXT PRIMARY KEY, referral_id TEXT NOT NULL REFERENCES referral(id),
    utilisateur_id TEXT NOT NULL, code TEXT NOT NULL, token TEXT UNIQUE,
    verifie INTEGER DEFAULT 0, tentatives INTEGER DEFAULT 0,
    expire_le TEXT NOT NULL, cree_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE push_subscription (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL, keys_p256dh TEXT NOT NULL, keys_auth TEXT NOT NULL,
    cree_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE enquete_satisfaction (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    utilisateur_id TEXT NOT NULL,
    note_globale INTEGER, note_ecoute INTEGER, note_utilite INTEGER,
    note_conseiller INTEGER, note_recommandation INTEGER,
    commentaire TEXT, points_forts TEXT, ameliorations TEXT,
    completee INTEGER DEFAULT 0, cree_le TEXT NOT NULL
  )`)
  await client.execute(`CREATE TABLE rappel (
    id TEXT PRIMARY KEY, prise_en_charge_id TEXT NOT NULL REFERENCES prise_en_charge(id),
    type TEXT NOT NULL, statut TEXT DEFAULT 'en_attente',
    date_envoi TEXT NOT NULL, contenu TEXT, cree_le TEXT NOT NULL
  )`)

  console.log('  Tables créées.\n')

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Generate 100 structures
  // ═══════════════════════════════════════════════════════════════
  console.log('[1/7] Création de 100 structures...')

  interface StructureRecord {
    id: string
    slug: string
    type: string
    city: typeof CITIES[0]
    conseillerIds: string[]
  }
  const structures: StructureRecord[] = []
  const structureRows: string[][] = []

  let cityIdx = 0
  for (const st of STRUCTURE_TYPES) {
    for (let i = 0; i < st.count; i++) {
      const city = CITIES[cityIdx % CITIES.length]
      cityIdx++
      const id = seedId('str')
      const suffix = city.ville.toLowerCase().replace(/[^a-z]/g, '')
      const slug = `${st.prefix}-${suffix}-${i + 1}`
      const typeName: Record<string, string> = {
        mission_locale: 'Mission Locale',
        cio: 'CIO',
        e2c: 'E2C',
        paio: 'PAIO',
        fondation: 'Fondation',
        association: 'Association',
      }
      const nom = `${typeName[st.type]} ${city.ville}`
      const specs = pick(SPECIALTIES[st.type])
      const streetNum = randInt(1, 150)
      const street = pick(STREET_NAMES)
      const adresse = `${streetNum} ${street}`
      const ageMin = st.type === 'cio' ? 14 : 16
      const ageMax = st.type === 'fondation' ? 30 : 25
      const capacite = randInt(20, 80)
      const creeLe = randomDate(randInt(180, 730))

      structures.push({ id, slug, type: st.type, city, conseillerIds: [] })

      structureRows.push([
        sqlVal(id), sqlVal(nom), sqlVal(slug), sqlVal(st.type),
        sqlVal(JSON.stringify([city.dept])), sqlVal(JSON.stringify([city.region])),
        String(ageMin), String(ageMax),
        sqlVal(JSON.stringify(specs)), 'NULL', String(capacite),
        sqlVal(adresse), sqlVal(city.cp), sqlVal(city.ville),
        String(city.lat + (Math.random() - 0.5) * 0.02),
        String(city.lng + (Math.random() - 0.5) * 0.02),
        'NULL', 'NULL', '1',
        sqlVal(creeLe), sqlVal(now),
      ])
    }
  }

  await batchInsert(client, 'structure', [
    'id', 'nom', 'slug', 'type', 'departements', 'regions',
    'age_min', 'age_max', 'specialites', 'genre_preference', 'capacite_max',
    'adresse', 'code_postal', 'ville', 'latitude', 'longitude',
    'webhook_url', 'parcoureo_id', 'actif', 'cree_le', 'mis_a_jour_le',
  ], structureRows)

  console.log(`  Fait. (${structures.length} structures)\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Generate ~700 conseillers
  // ═══════════════════════════════════════════════════════════════
  console.log('[2/7] Création des conseillers...')

  const mdp = await bcrypt.hash(PASSWORD, 12)
  const conseillerRows: string[][] = []
  const allConseillerIds: string[] = []
  const usedEmails = new Set<string>()

  for (const struct of structures) {
    const nbCons = randInt(5, 10)
    for (let c = 0; c < nbCons; c++) {
      const isFemale = Math.random() > 0.5
      const prenom = pick(isFemale ? PRENOMS_CONS_F : PRENOMS_CONS_M)
      const nom = pick(NOMS)
      const prenomNorm = normalize(prenom)
      const nomNorm = normalize(nom)
      const cityNorm = normalize(struct.city.ville)

      let email = `${prenomNorm}.${nomNorm}@${struct.slug.split('-').slice(0, 2).join('-')}.fr`
      let attempt = 0
      while (usedEmails.has(email)) {
        attempt++
        email = `${prenomNorm}.${nomNorm}${attempt}@${struct.slug.split('-').slice(0, 2).join('-')}.fr`
      }
      usedEmails.add(email)

      // Role distribution: ~85% conseiller, ~12% admin_structure, ~3% super_admin
      let role = 'conseiller'
      if (c === 0) role = 'admin_structure' // first one is always admin
      else if (Math.random() < 0.03) role = 'super_admin'

      const id = seedId('cons')
      const creeLe = randomDate(randInt(30, 365))
      const dernConn = Math.random() > 0.3 ? randomDate(randInt(0, 14)) : null

      struct.conseillerIds.push(id)
      allConseillerIds.push(id)

      conseillerRows.push([
        sqlVal(id), sqlVal(email), sqlVal(mdp),
        sqlVal(prenom), sqlVal(nom), sqlVal(role),
        sqlVal(struct.id), 'NULL', '1',
        sqlVal(dernConn), sqlVal(creeLe), sqlVal(now),
      ])
    }
  }

  await batchInsert(client, 'conseiller', [
    'id', 'email', 'mot_de_passe', 'prenom', 'nom', 'role',
    'structure_id', 'parcoureo_id', 'actif', 'derniere_connexion', 'cree_le', 'mis_a_jour_le',
  ], conseillerRows)

  const totalConseillers = conseillerRows.length
  console.log(`  Fait. (${totalConseillers} conseillers)\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Generate 3500 beneficiaries
  // ═══════════════════════════════════════════════════════════════
  console.log('[3/7] Création de 3500 bénéficiaires...')

  interface BenefRecord {
    id: string
    prenom: string
    age: number
    genre: string | null
    situation: string
    dept: string
    templateIdx: number
    convId: string
    refId: string
    creeLe: string
    structureIdx: number
    email: string
  }
  const beneficiaries: BenefRecord[] = []
  const utilisateurRows: string[][] = []
  const usedBenefEmails = new Set<string>()

  for (let b = 0; b < 3500; b++) {
    // Genre distribution: ~50% M, ~45% F, ~5% null
    let genre: string | null
    const gr = Math.random()
    if (gr < 0.50) genre = 'M'
    else if (gr < 0.95) genre = 'F'
    else genre = null

    const isFemale = genre === 'F'
    const prenom = pick(isFemale ? PRENOMS_F : (genre === 'M' ? PRENOMS_M : pick([PRENOMS_M, PRENOMS_F])))
    const age = randomAge()
    const situation = randomSituation()
    const structIdx = b % structures.length
    const city = structures[structIdx].city

    const id = seedId('usr')
    const convId = seedId('conv')
    const refId = seedId('ref')
    const prenomNorm = normalize(prenom)
    let email = `${prenomNorm}.${b}@email.com`
    usedBenefEmails.add(email)

    const templateIdx = b % CONVERSATION_TEMPLATES.length
    const daysAgo = randInt(1, 90)
    const creeLe = randomDate(daysAgo)
    const plateforme = pick(['web', 'web', 'web', 'pwa', 'pwa', 'android'])
    const source = pick(['direct', 'direct', 'parcoureo', 'prescripteur', 'qrcode', 'qrcode'])

    beneficiaries.push({
      id, prenom, age, genre, situation,
      dept: city.dept, templateIdx, convId, refId, creeLe,
      structureIdx: structIdx, email,
    })

    utilisateurRows.push([
      sqlVal(id), sqlVal(prenom), sqlVal(email), '0',
      'NULL', String(age), sqlVal(situation), 'NULL',
      'NULL', sqlVal(source), 'NULL', sqlVal(plateforme),
      'NULL', sqlVal(creeLe), sqlVal(now),
      'NULL', 'NULL', sqlVal(randomDate(randInt(0, 30))), 'NULL',
    ])
  }

  await batchInsert(client, 'utilisateur', [
    'id', 'prenom', 'email', 'email_verifie',
    'telephone', 'age', 'situation', 'code_parrainage',
    'parraine_par', 'source', 'source_detail', 'plateforme',
    'preferences', 'cree_le', 'mis_a_jour_le',
    'mot_de_passe', 'session_token', 'derniere_visite', 'supprime_le',
  ], utilisateurRows)

  console.log(`  Fait. (${beneficiaries.length} bénéficiaires)\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Generate conversations + messages
  // ═══════════════════════════════════════════════════════════════
  console.log('[4/7] Création des conversations et messages...')

  const conversationRows: string[][] = []
  const messageRows: string[][] = []
  let totalMessages = 0

  const phases = ['accroche', 'decouverte', 'exploration', 'projection', 'action']

  for (const benef of beneficiaries) {
    const tpl = CONVERSATION_TEMPLATES[benef.templateIdx]
    const msgs = tpl.messages
    const nbMsgs = msgs.length
    const phase = pick(phases)
    const duree = nbMsgs * 120 + randInt(60, 600)

    conversationRows.push([
      sqlVal(benef.convId), sqlVal(benef.id),
      sqlVal(`Conversation de ${benef.prenom}`),
      sqlVal('active'), sqlVal('direct'),
      String(nbMsgs), sqlVal(phase), String(duree),
      sqlVal(benef.creeLe), sqlVal(now),
    ])

    // Generate message timestamps
    const baseMs = new Date(benef.creeLe).getTime()
    for (let mi = 0; mi < nbMsgs; mi++) {
      const msg = msgs[mi]
      const offsetMs = (mi + 1) * randInt(30000, 180000)
      const horodatage = new Date(baseMs + offsetMs).toISOString()

      messageRows.push([
        sqlVal(seedId('msg')), sqlVal(benef.convId),
        sqlVal(msg.role), sqlVal(msg.contenu), sqlVal(msg.contenu),
        'NULL', '0', 'NULL', '0', sqlVal(horodatage),
      ])
      totalMessages++
    }
  }

  await batchInsert(client, 'conversation', [
    'id', 'utilisateur_id', 'titre', 'statut', 'origine',
    'nb_messages', 'phase', 'duree_secondes', 'cree_le', 'mis_a_jour_le',
  ], conversationRows)

  await batchInsert(client, 'message', [
    'id', 'conversation_id', 'role', 'contenu', 'contenu_brut',
    'url_audio', 'fragilite_detectee', 'niveau_fragilite', 'profil_extrait', 'horodatage',
  ], messageRows)

  console.log(`  Fait. (${beneficiaries.length} conversations, ${totalMessages} messages)\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Generate RIASEC profiles + confidence indices
  // ═══════════════════════════════════════════════════════════════
  console.log('[5/7] Création des profils RIASEC et indices de confiance...')

  const riasecRows: string[][] = []
  const confianceRows: string[][] = []

  for (const benef of beneficiaries) {
    const tpl = CONVERSATION_TEMPLATES[benef.templateIdx]
    const base = tpl.riasecBase

    // Add some variation
    const vary = (v: number) => Math.max(0, Math.min(100, v + randInt(-15, 15)))
    const r = vary(base.r), iScore = vary(base.i), a = vary(base.a)
    const s = vary(base.s), e = vary(base.e), c = vary(base.c)

    const scores = [
      { k: 'R', v: r }, { k: 'I', v: iScore }, { k: 'A', v: a },
      { k: 'S', v: s }, { k: 'E', v: e }, { k: 'C', v: c },
    ].sort((x, y) => y.v - x.v)

    const confiance = +(0.3 + Math.random() * 0.6).toFixed(2)
    const estStable = confiance > 0.65 ? 1 : 0
    const niveau = confiance > 0.75 ? 'precis' : confiance > 0.5 ? 'emergent' : 'debut'

    riasecRows.push([
      sqlVal(seedId('rias')), sqlVal(benef.id),
      String(r), String(iScore), String(a), String(s), String(e), String(c),
      sqlVal(JSON.stringify(scores.slice(0, 2).map(x => x.k))),
      sqlVal(JSON.stringify(tpl.traits)),
      sqlVal(JSON.stringify(tpl.interets)),
      sqlVal(JSON.stringify(tpl.forces)),
      sqlVal(tpl.suggestions.join(', ')),
      sqlVal('conversation'), String(estStable),
      sqlVal(confiance > 0.65 ? 'fort' : 'mixte'),
      sqlVal(now),
    ])

    confianceRows.push([
      sqlVal(seedId('conf')), sqlVal(benef.id),
      String(confiance), sqlVal(niveau),
      String(+(Math.random() * 0.5 + 0.3).toFixed(2)),
      String(+(Math.random() * 0.5 + 0.3).toFixed(2)),
      String(+(Math.random() * 0.5 + 0.3).toFixed(2)),
      String(+(Math.random() * 0.5 + 0.3).toFixed(2)),
      String(tpl.messages.length),
      String(Math.floor(tpl.messages.length / 3)),
      sqlVal(now),
    ])
  }

  await batchInsert(client, 'profil_riasec', [
    'id', 'utilisateur_id', 'r', 'i', 'a', 's', 'e', 'c',
    'dimensions_dominantes', 'traits', 'interets', 'forces',
    'suggestion', 'source', 'est_stable', 'coherence_signaux', 'mis_a_jour_le',
  ], riasecRows)

  await batchInsert(client, 'indice_confiance', [
    'id', 'utilisateur_id', 'score_global', 'niveau',
    'volume', 'stabilite', 'differenciation', 'coherence',
    'nb_messages', 'nb_instantanes', 'mis_a_jour_le',
  ], confianceRows)

  console.log(`  Fait. (${riasecRows.length} profils RIASEC, ${confianceRows.length} indices de confiance)\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Generate referrals with status distribution
  // ═══════════════════════════════════════════════════════════════
  console.log('[6/7] Création des referrals et prises en charge...')

  const referralRows: string[][] = []
  const pecRows: string[][] = []
  const directMsgRows: string[][] = []

  // Status distribution
  // 40% en_attente (1400), 30% prise_en_charge (1050), 15% terminee (525), 10% rupture (350), 5% annulee (175)
  function randomRefStatus(idx: number): string {
    const r = idx / 3500
    if (r < 0.40) return 'en_attente'
    if (r < 0.70) return 'prise_en_charge'
    if (r < 0.85) return 'terminee'
    if (r < 0.95) return 'rupture'
    return 'annulee'
  }

  // Shuffle beneficiary indices for random distribution
  const shuffledIndices = Array.from({ length: 3500 }, (_, i) => i).sort(() => Math.random() - 0.5)

  const statusCounts: Record<string, number> = {}
  let totalDirectMessages = 0

  const MOTIFS = [
    'Besoin d\'aide pour l\'orientation professionnelle',
    'Décrochage scolaire, recherche d\'alternatives',
    'En recherche d\'emploi, besoin d\'accompagnement',
    'Souhaite explorer de nouvelles voies',
    'Difficultés financières et besoin d\'insertion',
    'Réorientation après échec en études supérieures',
    'Recherche d\'apprentissage ou d\'alternance',
    'Besoin de stage découverte métier',
    'Isolement social et professionnel',
    'Intéressé(e) par la création d\'entreprise',
  ]

  const DIRECT_MSGS_CONSEILLER = [
    'Bonjour ! Je suis votre conseiller(e) référent(e). J\'ai pris connaissance de votre profil et je suis là pour vous accompagner.',
    'J\'ai bien reçu votre dossier. Quand seriez-vous disponible pour un premier entretien ?',
    'N\'hésitez pas si vous avez des questions en attendant notre rendez-vous.',
    'Je vous ai trouvé quelques pistes intéressantes. On en discute à notre prochaine rencontre.',
    'Comment ça s\'est passé depuis notre dernier échange ?',
  ]

  const DIRECT_MSGS_BENEF = [
    'Merci beaucoup de me prendre en charge. J\'ai vraiment besoin d\'aide.',
    'Je suis disponible en semaine après 16h.',
    'Est-ce qu\'on peut faire un point cette semaine ?',
    'J\'ai commencé à regarder les formations dont vous m\'avez parlé.',
    'Merci pour votre aide, ça me remotive !',
  ]

  for (let si = 0; si < shuffledIndices.length; si++) {
    const bIdx = shuffledIndices[si]
    const benef = beneficiaries[bIdx]
    const tpl = CONVERSATION_TEMPLATES[benef.templateIdx]
    const statut = randomRefStatus(si)

    statusCounts[statut] = (statusCounts[statut] || 0) + 1

    const priorite = randomPriorite()
    const niveauDetection = priorite === 'critique' ? 3 : priorite === 'haute' ? 2 : 1
    // Source: 60% sourcee, 40% generique
    const isSourcee = Math.random() < 0.60
    const referralSource = isSourcee ? 'sourcee' : 'generique'
    const struct = structures[benef.structureIdx]
    const structSuggereId = isSourcee ? struct.id : null

    const contactType = Math.random() > 0.3 ? 'email' : 'telephone'
    const moyenContact = contactType === 'email'
      ? benef.email
      : `06${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`

    const motif = pick(MOTIFS)
    const resume = `${benef.prenom}, ${benef.age} ans, ${benef.situation}. ${tpl.theme}. ${motif}`

    referralRows.push([
      sqlVal(benef.refId), sqlVal(benef.id), sqlVal(benef.convId),
      sqlVal(priorite), String(niveauDetection),
      sqlVal(motif), sqlVal(resume),
      sqlVal(moyenContact), sqlVal(contactType),
      sqlVal(statut), sqlVal(referralSource),
      '0', 'NULL', '0',
      sqlVal(structSuggereId), sqlVal(benef.dept),
      sqlVal(benef.genre), String(benef.age),
      sqlVal(benef.creeLe), sqlVal(now), 'NULL',
    ])

    // Prise en charge for prise_en_charge and terminee statuses
    if (statut === 'prise_en_charge' || statut === 'terminee') {
      const pecId = seedId('pec')
      const consId = pick(struct.conseillerIds)
      const scoreMatching = +(0.55 + Math.random() * 0.4).toFixed(2)
      const pecCreeLe = randomDate(randInt(1, 60))
      const termineeLe = statut === 'terminee' ? randomDate(randInt(0, 15)) : null

      pecRows.push([
        sqlVal(pecId), sqlVal(benef.refId), sqlVal(consId), sqlVal(struct.id),
        sqlVal(statut === 'terminee' ? 'terminee' : 'prise_en_charge'),
        'NULL', String(scoreMatching),
        sqlVal(`Matching: dept ${benef.dept}, profil ${tpl.theme}`),
        '0', sqlVal(pecCreeLe),
        sqlVal(termineeLe), '1',
        sqlVal(pecCreeLe), sqlVal(now),
      ])

      // Direct messages (2-5)
      const nbDMs = randInt(2, 5)
      const dmBaseMs = new Date(pecCreeLe).getTime()
      for (let d = 0; d < nbDMs; d++) {
        const isConseiller = d % 2 === 0
        const contenu = isConseiller
          ? pick(DIRECT_MSGS_CONSEILLER)
          : pick(DIRECT_MSGS_BENEF)
        const horodatage = new Date(dmBaseMs + (d + 1) * randInt(3600000, 86400000)).toISOString()

        directMsgRows.push([
          sqlVal(seedId('dm')), sqlVal(pecId),
          sqlVal(isConseiller ? 'conseiller' : 'beneficiaire'),
          sqlVal(isConseiller ? consId : benef.id),
          sqlVal(contenu), sqlVal('direct'),
          String(Math.random() > 0.3 ? 1 : 0),
          sqlVal(horodatage),
        ])
        totalDirectMessages++
      }
    }
  }

  await batchInsert(client, 'referral', [
    'id', 'utilisateur_id', 'conversation_id',
    'priorite', 'niveau_detection',
    'motif', 'resume_conversation',
    'moyen_contact', 'type_contact',
    'statut', 'source',
    'webhook_envoye', 'webhook_reponse', 'relance_envoyee',
    'structure_suggeree_id', 'localisation',
    'genre', 'age_beneficiaire',
    'cree_le', 'mis_a_jour_le', 'recontacte_le',
  ], referralRows)

  await batchInsert(client, 'prise_en_charge', [
    'id', 'referral_id', 'conseiller_id', 'structure_id',
    'statut', 'notes', 'score_matching', 'raison_matching',
    'assignee_manuellement', 'premiere_action_le',
    'terminee_le', 'notification_envoyee',
    'cree_le', 'mis_a_jour_le',
  ], pecRows)

  await batchInsert(client, 'message_direct', [
    'id', 'prise_en_charge_id',
    'expediteur_type', 'expediteur_id',
    'contenu', 'conversation_type',
    'lu', 'horodatage',
  ], directMsgRows)

  console.log(`  Fait.`)
  console.log(`    Referrals: ${referralRows.length}`)
  for (const [s, c] of Object.entries(statusCounts).sort()) {
    console.log(`      ${s}: ${c}`)
  }
  console.log(`    Prises en charge: ${pecRows.length}`)
  console.log(`    Messages directs: ${totalDirectMessages}\n`)

  // ═══════════════════════════════════════════════════════════════
  // STEP 7: Summary
  // ═══════════════════════════════════════════════════════════════
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║           RÉSUMÉ DU SEED MASSIF             ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  Structures:          ${String(structures.length).padStart(6)}              ║`)
  console.log(`║  Conseillers:         ${String(totalConseillers).padStart(6)}              ║`)
  console.log(`║  Bénéficiaires:       ${String(beneficiaries.length).padStart(6)}              ║`)
  console.log(`║  Conversations:       ${String(beneficiaries.length).padStart(6)}              ║`)
  console.log(`║  Messages IA:         ${String(totalMessages).padStart(6)}              ║`)
  console.log(`║  Profils RIASEC:      ${String(riasecRows.length).padStart(6)}              ║`)
  console.log(`║  Referrals:           ${String(referralRows.length).padStart(6)}              ║`)
  console.log(`║  Prises en charge:    ${String(pecRows.length).padStart(6)}              ║`)
  console.log(`║  Messages directs:    ${String(totalDirectMessages).padStart(6)}              ║`)
  console.log(`║  Temps d'exécution:   ${elapsed.padStart(5)}s              ║`)
  console.log('╚══════════════════════════════════════════════╝')
  console.log('\n✓ Mot de passe conseillers: catchup2026')
  console.log('✓ DB: file:/app/data/local.db')
}

seedMassive().catch(err => {
  console.error('Erreur lors du seed:', err)
  process.exit(1)
})
