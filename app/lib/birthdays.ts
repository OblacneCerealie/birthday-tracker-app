import AsyncStorage from "@react-native-async-storage/async-storage";

export type Birthday = {
  name: string;
  date: string; // Format: YYYY-MM-DD
};

// Sebastian's birthdays (read-only)
export const birthdays: Birthday[] = [
  { name: "Adam Truchly", date: "2000-04-07" },
  { name: "Barbora Dorňáková", date: "2008-05-20" },
  { name: "Barbora Jančíková", date: "2007-04-01" },
  { name: "Barbora Pfeiler", date: "2007-08-22" },
  { name: "Ben McAughtry", date: "2006-10-19" },
  { name: "Dominika Boso", date: "2000-06-05" },
  { name: "Ella “Jack”", date: "2025-05-09" },
  { name: "Ema Čečetková", date: "2006-06-15" },
  { name: "Ema Petrakovičová", date: "2007-07-09" },
  { name: "Eva Stratilova", date: "2000-10-03" },
  { name: "Filip Novota", date: "2006-05-27" },
  { name: "Filip Oros", date: "2006-05-19" },
  { name: "Hana Kyselovičová", date: "2006-07-28" },
  { name: "Ingrid Feriancova", date: "1965-01-31" },
  { name: "Ingrid smutna", date: "2006-06-07" },
  { name: "Jakub Krajňák", date: "2007-02-24" },
  { name: "Jakub Mazúr", date: "2005-05-27" },
  { name: "Jozef Kubica", date: "1954-01-10" },
  { name: "Karla Chudíková", date: "2006-01-21" },
  { name: "Kristína Flimelová", date: "2007-04-04" },
  { name: "Kristína Krisztínová", date: "2006-10-12" },
  { name: "Kristína Šoltysová", date: "2000-01-20" },
  { name: "Kristina Šujanova", date: "2009-02-27" },
  { name: "Linda Čechovičová", date: "2007-12-22" },
  { name: "Lucia Brliťová", date: "2005-08-05" },
  { name: "Lucia Pollaková", date: "2007-06-12" },
  { name: "Lukáš Kalata", date: "2008-04-20" },
  { name: "Marek Bánoš", date: "2007-05-21" },
  { name: "Matej Michalko", date: "2000-11-17" },
  { name: "Matej Miluláš Sapi", date: "2005-12-12" },
  { name: "Martin Petrakovič", date: "2006-03-23" },
  { name: "Martin Valíček", date: "2005-06-01" },
  { name: "Martina Škoricová", date: "2007-04-05" },
  { name: "Mia Štúrová", date: "2008-05-20" },
  { name: "Michaela Slivova", date: "2006-03-09" },
  { name: "Michael Janiak", date: "2007-01-04" },
  { name: "Michal Konečný", date: "2007-06-26" },
  { name: "Milan Kopecký", date: "1984-02-16" },
  { name: "Miroslava Kubínova", date: "2000-10-07" },
  { name: "Natalia Zahradnikova", date: "2005-11-03" },
  { name: "Nina Žovincova", date: "2006-09-13" },
  { name: "Oliver Kocian", date: "2006-09-07" },
  { name: "Patrícia Mikulová", date: "2006-10-27" },
  { name: "Peter Riegl", date: "1981-10-27" },
  { name: "Peter Sás", date: "1995-08-23" },
  { name: "Peter Sládek", date: "2000-03-21" },
  { name: "Petra Ehrmannová", date: "2000-09-23" },
  { name: "Pietro", date: "2009-03-01" },
  { name: "Rebeka Jakabovičová", date: "1996-12-31" },
  { name: "Reňo Tokar", date: "2007-06-18" },
  { name: "Samuel Halienka", date: "2006-09-07" },
  { name: "Samuel Sidivar", date: "2007-05-28" },
  { name: "Sarah Kralova", date: "2000-04-04" },
  { name: "Stela Kralova", date: "2006-05-05" },
  { name: "Tibor Michlko", date: "1969-05-13" },
  { name: "Vanesa Vizentova", date: "2006-05-14" },
  { name: "Veronika Vrablecová", date: "2005-06-28" },
  { name: "Zoja Zaklaiova", date: "2004-12-17" },
];

const STORAGE_KEY = "userBirthdays";

// General helper
function getNextOccurrence(dateStr: string): Date {
  const today = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  return thisYear >= today
    ? thisYear
    : new Date(today.getFullYear() + 1, month - 1, day);
}

// For Sebastian (read-only)
export function getUpcomingBirthdays(): {
  name: string;
  date: string;
  daysAway: number;
}[] {
  const today = new Date();
  return birthdays
    .map((b) => {
      const next = getNextOccurrence(b.date);
      const diff = Math.ceil((+next - +today) / (1000 * 60 * 60 * 24));
      return { ...b, date: next.toDateString(), daysAway: diff };
    })
    .sort((a, b) => a.daysAway - b.daysAway);
}

// For others (editable)
export async function getUserBirthdays(): Promise<Birthday[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveBirthday(birthday: Birthday) {
  if (/\d/.test(birthday.name)) {
    throw new Error("Name cannot contain numbers.");
  }

  const current = await getUserBirthdays();
  const updated = [...current, birthday];

  // Sort alphabetically by name
  updated.sort((a, b) => a.name.localeCompare(b.name));

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}


export function getUpcomingUserBirthdays(birthdays: Birthday[]) {
  const today = new Date();
  return birthdays
    .map((b) => {
      const next = getNextOccurrence(b.date);
      const diff = Math.ceil((+next - +today) / (1000 * 60 * 60 * 24));
      return { ...b, date: next.toDateString(), daysAway: diff };
    })
    .sort((a, b) => a.daysAway - b.daysAway);
}
