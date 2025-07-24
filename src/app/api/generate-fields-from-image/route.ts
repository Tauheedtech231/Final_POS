import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
    }
    console.log("Received image file:", imageFile)

    const base64Image = await imageToBase64(imageFile);
    // console.log("Converted image to base64",base64Image.toString());
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const stream = await model.generateContentStream([
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      },{
     text: `You are an AI assistant for a Point of Sale (POS) system. Analyze the uploaded product image and extract or infer all relevant product details based solely on the image content.

Instructions:

1. Detect the product's **category** based on visual cues in the image (e.g., Fruit, Electronics, Beverage, Grocery, etc.). Do not assume or guess without visual evidence.
2. Based on the detected category and appearance, generate:
   - A clear and relevant **product name**
   - A brief **description** of the product
   - An estimated **price in PKR**, based on average market rates in Pakistan
   - A unique **SKU** in this format: [3-letter UPPERCASE category code]-[random 3-digit number] (e.g., ELE-523, BEV-102)
   - if the supplier is not Found Then set To Unkonwn Supplier

3. If the image does not contain enough information to determine the category, respond exactly with:
"Unable to detect category from the image."

Return the final result in this structured format:

Name: ...
Category: ...
Price : ...
SKU: ...
Description: ...
Supplier: ...`

      }
    ]);

    let fullText = "";
    for await (const chunk of stream.stream) {
      const part = chunk.text();
      fullText += part;
    }

    console.log("AI Response:\n", fullText);
    return NextResponse.json({ result: fullText });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Failed to generate fields." }, { status: 500 });
  }
}

async function imageToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
