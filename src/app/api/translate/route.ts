import { NextResponse } from "next/server";
import { z } from "zod";
import { translateMedicalText, SupportedLanguage } from "@/lib/services/translator";
import { handleRouteError, jsonError } from "@/lib/api";

const translateSchema = z.object({
  text: z.string().min(1),
  targetLang: z.enum(["en", "hi", "te"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = translateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Valid 'text' and 'targetLang' (en, hi, te) are required.", 400);
    }

    const { text, targetLang } = parsed.data;
    const translatedText = await translateMedicalText(text, targetLang as SupportedLanguage);

    return NextResponse.json({
      originalText: text,
      translatedText,
      targetLang,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
