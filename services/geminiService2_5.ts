
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, QualificationCriteria, DeepAuditResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLASH_2_5 = 'gemini-2.5-flash-native-audio-preview-12-2025';

const sanitizeText = (text: string) => {
  return text.replace(/"/g, "'").replace(/[\n\r]/g, " ").trim();
};

const searchForLeadsRaw = async (criteria: QualificationCriteria, count: number): Promise<{text: string, groundingChunks: any[]}> => {
  const prompt = `Find ${count} active ${criteria.niche} companies in ${criteria.city}. 
  For each business, identify a high-level contact (CEO, Owner, or Marketing Director).
  
  STRICT RULES:
  1. Only return a Name/Role/Email if it is EXPLICITLY FOUND in search results.
  2. If not found, use "Unknown".
  3. Never guess email addresses or patterns.
  
  Return: Business Name, Website, Contact Person Name, Role, and Email.`;

  const response = await ai.models.generateContent({
    model: FLASH_2_5,
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
  
  const response = await ai.models.generateContent({
    model: FLASH_2_5,
    contents: `Convert this business research into a JSON array. 
    Score based on need for: "${criteria.additionalNotes}".
    MANDATORY: Use "Unknown" for Name/Email if not found. Do not guess.
    
    RESEARCH DATA: ${sanitizedInput}`,
    config: {
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
    console.error("JSON Structure error (2.5):", e);
    return [];
  }
};

export const discoverLeads2_5 = async (criteria: QualificationCriteria, count: number = 10, mode: 'performance' | 'intelligence' = 'performance'): Promise<Lead[]> => {
  try {
    const { text, groundingChunks } = await searchForLeadsRaw(criteria, Math.min(count, 20));
    const structuredLeads = await structureLeads(text, criteria, mode);
    
    return structuredLeads.map((l: any, index: number) => ({
      ...l,
      id: `lead-25-${Date.now()}-${index}`,
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
        proofPoints: ["Found via Grounded 2.5 Wave"],
        verificationEvidence: "AI Identified (Grounded 2.5)",
        isLikelyReal: true,
        decisionMaker: {
          name: l.foundDecisionMaker.name,
          role: l.foundDecisionMaker.role,
          contactHint: "Extracted from grounded 2.5 search"
        }
      } : undefined
    })) as Lead[];
  } catch (e: any) {
    console.error("Discovery error (2.5):", e);
    return [];
  }
};

export const performDeepAudit2_5 = async (lead: Lead, serviceOffered: string): Promise<DeepAuditResult> => {
  try {
    const searchResponse = await ai.models.generateContent({
      model: FLASH_2_5,
      contents: `THOROUGH CONTACT SEARCH: Find the REAL Marketing Manager or CEO contact information for ${lead.name} (${lead.website}). 
      ONLY extract what is EXPLICITLY FOUND. Use "Unknown" if info is missing.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawAuditText = sanitizeText(searchResponse.text || "No activity found.");

    const structureResponse = await ai.models.generateContent({
      model: FLASH_2_5,
      contents: `Extract grounded details from: "${rawAuditText}". Use "Unknown" where data is missing.`,
      config: {
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
                linkedinUrl: { type: Type.STRING }
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
    console.error("Audit error (2.5):", e);
    throw e;
  }
};
