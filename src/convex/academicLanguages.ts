import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const SEED_DATA: Array<{
  name: string;
  code: string;
  isoCode: string;
  nativeName: string;
  isRTL: boolean;
  color: string;
  icon: string;
  description: string;
}> = [
  { name: "English", code: "EN", isoCode: "en", nativeName: "English", isRTL: false, color: "#4285f4", icon: "Globe", description: "Global lingua franca — widely used for academic instruction and communication." },
  { name: "Hindi", code: "HI", isoCode: "hi", nativeName: "हिन्दी", isRTL: false, color: "#e8710a", icon: "Languages", description: "Official language of India — widely spoken across northern and central India." },
  { name: "Arabic", code: "AR", isoCode: "ar", nativeName: "العربية", isRTL: true, color: "#0d9488", icon: "BookText", description: "Semitic language — widely used in Islamic studies and Middle Eastern curricula." },
  { name: "French", code: "FR", isoCode: "fr", nativeName: "Français", isRTL: false, color: "#1a73e8", icon: "Flag", description: "Romance language — official in 29 countries and widely taught globally." },
  { name: "German", code: "DE", isoCode: "de", nativeName: "Deutsch", isRTL: false, color: "#fbbc04", icon: "Flag", description: "Germanic language — widely used in European academic and business contexts." },
  { name: "Spanish", code: "ES", isoCode: "es", nativeName: "Español", isRTL: false, color: "#ea4335", icon: "Flag", description: "Romance language — official in 20 countries and widely taught worldwide." },
  { name: "Urdu", code: "UR", isoCode: "ur", nativeName: "اردو", isRTL: true, color: "#4f46e5", icon: "BookMarked", description: "Indo-Aryan language — official in India and national language of Pakistan." },
  { name: "Tamil", code: "TA", isoCode: "ta", nativeName: "தமிழ்", isRTL: false, color: "#a855f7", icon: "BookOpen", description: "Dravidian language — one of the oldest living languages, official in Tamil Nadu and Sri Lanka." },
  { name: "Malayalam", code: "ML", isoCode: "ml", nativeName: "മലയാളം", isRTL: false, color: "#34a853", icon: "BookOpen", description: "Dravidian language — official in Kerala and Union Territories." },
  { name: "Kannada", code: "KN", isoCode: "kn", nativeName: "ಕನ್ನಡ", isRTL: false, color: "#06b6d4", icon: "BookOpen", description: "Dravidian language — official in Karnataka state." },
  { name: "Marathi", code: "MR", isoCode: "mr", nativeName: "मराठी", isRTL: false, color: "#f43f5e", icon: "BookOpen", description: "Indo-Aryan language — official in Maharashtra state." },
  { name: "Gujarati", code: "GU", isoCode: "gu", nativeName: "ગુજરાતી", isRTL: false, color: "#10b981", icon: "BookOpen", description: "Indo-Aryan language — official in Gujarat state." },
  { name: "Punjabi", code: "PA", isoCode: "pa", nativeName: "ਪੰਜਾਬੀ", isRTL: false, color: "#f59e0b", icon: "MessageSquare", description: "Indo-Aryan language — official in Punjab state." },
  { name: "Bengali", code: "BN", isoCode: "bn", nativeName: "বাংলা", isRTL: false, color: "#d4a017", icon: "MessageCircle", description: "Indo-Aryan language — official in West Bengal and national language of Bangladesh." },
  { name: "Sanskrit", code: "SA", isoCode: "sa", nativeName: "संस्कृतम्", isRTL: false, color: "#9aa0a6", icon: "ScrollText", description: "Classical language of India — ancient liturgical and scholarly language." },
];

export const listAcademicLanguages = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicLanguages").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicLanguage = query({
  args: { languageId: v.id("academicLanguages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.languageId);
  },
});

export const createAcademicLanguage = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    isoCode: v.string(),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    isRTL: v.boolean(),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicLanguages" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicLanguages").collect();
    const maxSeq = allItems.reduce((max: any, l: any) => Math.max(max, l.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicLanguages", {
      name: args.name,
      code: args.code,
      isoCode: args.isoCode,
      nativeName: args.nativeName,
      description: args.description,
      color: args.color,
      icon: args.icon,
      isRTL: args.isRTL,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateAcademicLanguage = mutation({
  args: { token: v.optional(v.string()),
    languageId: v.id("academicLanguages"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    isoCode: v.optional(v.string()),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isRTL: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicLanguages" }, async (ctx, args) => {
    const { token: _token, languageId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(languageId, updates);
  }),
});

export const deleteAcademicLanguage = mutation({
  args: { token: v.optional(v.string()), languageId: v.id("academicLanguages") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicLanguages" }, async (ctx, args) => {
    await ctx.db.delete(args.languageId);
  }),
});

export const duplicateAcademicLanguage = mutation({
  args: { token: v.optional(v.string()), languageId: v.id("academicLanguages") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicLanguages" }, async (ctx, args) => {
    const original = await ctx.db.get(args.languageId);
    if (!original) throw new Error("Academic language not found");
    const allItems = await ctx.db.query("academicLanguages").collect();
    const maxSeq = allItems.reduce((max: any, l: any) => Math.max(max, l.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicLanguages", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      isoCode: `${original.isoCode}_copy`,
      nativeName: original.nativeName,
      description: original.description,
      color: original.color,
      icon: original.icon,
      isRTL: original.isRTL,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderAcademicLanguages = mutation({
  args: { token: v.optional(v.string()),
    languageIds: v.array(v.id("academicLanguages")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicLanguages" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.languageIds.length; i++) {
      await ctx.db.patch(args.languageIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicLanguages = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicLanguages" }, async (ctx) => {
    const existing = await ctx.db.query("academicLanguages").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic languages already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicLanguages", {
        name: seed.name,
        code: seed.code,
        isoCode: seed.isoCode,
        nativeName: seed.nativeName,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        isRTL: seed.isRTL,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default academic languages created" };
  }),
});
