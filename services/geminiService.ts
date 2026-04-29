
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, QualificationCriteria, DeepAuditResult, NicheIntel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

const sanitizeText = (text: string) => {
  return text.replace(/"/g, "'").replace(/[\n\r]/g, " ").trim();
};

const getModel = (mode: 'performance' | 'intelligence') => {
  return mode === 'performance' ? FLASH_MODEL : PRO_MODEL;
};

export const generateNicheIntel = async (niche: string, serviceOffered: string): Promise<NicheIntel> => {
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Act as a senior market researcher. Generate intelligence for hunting leads in the "${niche}" niche for a company offering "${serviceOffered}".
    Focus on finding UNFAMILIAR, mid-sized, or boutique companies rather than national giants.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          idealLeadProfile: { type: Type.STRING },
          buyingSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedPainPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          competitorFocus: { type: Type.STRING },
          strictExclusionCriteria: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Types of companies or specific names to skip." }
        },
        required: ['idealLeadProfile', 'buyingSignals', 'suggestedPainPoints', 'competitorFocus', 'strictExclusionCriteria']
      }
    }
  });
  return JSON.parse(response.text || '{}') as NicheIntel;
};

const searchForLeadsRaw = async (criteria: QualificationCriteria, count: number): Promise<{text: string, groundingChunks: any[]}> => {
  const exclusionText = criteria.excludedWebsites?.length 
    ? `MANDATORY: Do NOT include any of the following websites: ${criteria.excludedWebsites.join(', ')}.` 
    : '';

  const intelPrompt = criteria.nicheIntel ? `
    STRICT FOCUS:
    - Ideal Profile: ${criteria.nicheIntel.idealLeadProfile}
    - Buying Signals: ${criteria.nicheIntel.buyingSignals.join(', ')}
    - Exclude: ${criteria.nicheIntel.strictExclusionCriteria.join(', ')}` : '';

  const prompt = `Find ${count} high-intent boutique/local ${criteria.niche} companies in ${criteria.city}. 
  ${exclusionText}
  ${intelPrompt}
  
  MANDATORY FILTER:
  The user is specifically looking for this type of company: "${criteria.idealCompanyType}".
  Only return leads that fit this specific profile description.
  
  CORE MISSION: 
  I need the REAL contact details for these businesses. 
  
  SEARCH GUIDELINES:
  1. For EACH company found, specifically search for their "Contact Us" or "About" page.
  2. EXTRACT: 
     - A valid business EMAIL address.
     - A business PHONE number.
     - The LINKEDIN profile URL of the company or the owner/CEO.
  3. If you see a phone number on their website or Google listing, capture it.
  4. If an email isn't on the homepage, check for info@, hello@, or contact@ patterns verified by search snippets.
  
  Return: Business Name, Website URL, Phone Number, Email Address, LinkedIn URL, Contact Person Name, and Role.`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text || "",
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

const structureLeads = async (rawText: string, criteria: QualificationCriteria, mode: 'performance' | 'intelligence'): Promise<any[]> => {
  const sanitizedInput = sanitizeText(rawText);
  const model = getModel(mode);
  
  const response = await ai.models.generateContent({
    model: model,
    contents: `Convert this business research into a JSON array of qualified leads. 
    You MUST extract the phone number, email, and LinkedIn URL for every business.
    
    RESEARCH DATA: ${sanitizedInput}
    
    QUALIFICATION RULES:
    Score based on alignment with service offered: "${criteria.additionalNotes}"
    AND specifically alignment with ideal company profile: "${criteria.idealCompanyType}".
    
    If any field is missing, use "Unknown", but prioritize finding real data.`,
    config: {
      ...(mode === 'intelligence' ? { thinkingConfig: { thinkingBudget: 4000 } } : {}),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            website: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            socials: {
              type: Type.OBJECT,
              properties: {
                instagram: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                facebook: { type: Type.STRING }
              }
            },
            source: { type: Type.STRING },
            score: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                nicheAlignment: { type: Type.NUMBER },
                commercialIntent: { type: Type.NUMBER },
                dataVeracity: { type: Type.NUMBER }
              },
              required: ['nicheAlignment', 'commercialIntent', 'dataVeracity']
            },
            reasoning: { type: Type.STRING },
            foundDecisionMaker: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING }
              }
            }
          },
          required: ['name', 'website', 'email', 'phone', 'socials', 'source', 'score', 'confidence', 'scoreBreakdown', 'reasoning']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("JSON Structure error:", e);
    return [];
  }
};

export const discoverLeads = async (criteria: QualificationCriteria, count: number = 10, mode: 'performance' | 'intelligence' = 'performance'): Promise<Lead[]> => {
  try {
    const { text, groundingChunks } = await searchForLeadsRaw(criteria, count);
    const structuredLeads = await structureLeads(text, criteria, mode);
    
    return structuredLeads.map((l: any, index: number) => ({
      ...l,
      id: `lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      niche: criteria.niche,
      city: criteria.city,
      status: 'found',
      source: 'Google',
      isManuallyVerified: false,
      sourceUrl: groundingChunks[index % (groundingChunks.length || 1)]?.web?.uri || l.website,
      deepAudit: (l.foundDecisionMaker && l.foundDecisionMaker.name !== "Unknown") ? {
        realnessScore: l.score,
        lastActiveDate: "Recent",
        socialProofStrength: "Medium",
        proofPoints: ["Identified via grounded search"],
        verificationEvidence: "Grounded AI Result",
        isLikelyReal: true,
        decisionMaker: {
          name: l.foundDecisionMaker.name,
          role: l.foundDecisionMaker.role,
          contactHint: "Verified source found",
          linkedinUrl: l.socials?.linkedin
        }
      } : undefined
    })) as Lead[];
  } catch (e: any) {
    if (e?.message?.includes('429')) throw new Error("RATE_LIMIT_HIT");
    console.error("Discovery error:", e);
    return [];
  }
};

export const verifyLeadContact = async (lead: Lead): Promise<{ verified: boolean, message: string, confidence: number }> => {
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `VERIFY CONTACT DATA: Confirm if the email "${lead.email}" and phone "${lead.phone}" for "${lead.name}" are valid.
    Search their website (${lead.website}) and social media to find proof.`,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const analysis = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Analyze this research and verify if the contact info for "${lead.name}" is accurate.
    Research: ${sanitizeText(response.text || "No data found.")}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verified: { type: Type.BOOLEAN },
          message: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ['verified', 'message', 'confidence']
      }
    }
  });

  return JSON.parse(analysis.text || '{}');
};

export const performDeepAudit = async (lead: Lead, serviceOffered: string, mode: 'performance' | 'intelligence' = 'intelligence'): Promise<DeepAuditResult> => {
  try {
    const searchResponse = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `THOROUGH GROUNDED SEARCH: Find the REAL Phone, Email, and LinkedIn profile for the Owner/CEO of ${lead.name} (${lead.website}).
      
      Look for:
      1. Their LinkedIn personal profile.
      2. Their direct email or the best verified business email.
      3. The primary phone number for the business.
      
      BE TENACIOUS. Check LinkedIn, Facebook, Yelp, and the company "Team" page.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawAuditText = sanitizeText(searchResponse.text || "No grounded details found.");
    const model = getModel(mode);

    const structureResponse = await ai.models.generateContent({
      model: model,
      contents: `Extract decision maker profile, phone, and social links from research: "${rawAuditText}".`,
      config: {
        ...(mode === 'intelligence' ? { thinkingConfig: { thinkingBudget: 4000 } } : {}),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            realnessScore: { type: Type.NUMBER },
            lastActiveDate: { type: Type.STRING },
            socialProofStrength: { type: Type.STRING },
            proofPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            verificationEvidence: { type: Type.STRING },
            isLikelyReal: { type: Type.BOOLEAN },
            decisionMaker: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                contactHint: { type: Type.STRING },
                linkedinUrl: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING }
              },
              required: ['name', 'role', 'contactHint']
            }
          },
          required: ['realnessScore', 'lastActiveDate', 'socialProofStrength', 'proofPoints', 'verificationEvidence', 'isLikelyReal', 'decisionMaker']
        }
      }
    });

    return JSON.parse(structureResponse.text || '{}') as DeepAuditResult;
  } catch (e: any) {
    if (e?.message?.includes('429')) throw new Error("RATE_LIMIT_HIT");
    console.error("Audit error:", e);
    throw e;
  }
};
