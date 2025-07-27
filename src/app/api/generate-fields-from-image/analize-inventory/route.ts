
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs/promises';
import supabase from '@/lib/supabaseClient';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // 1. Detect if input is Urdu using simple regex
    // const isUrdu = /[\u0600-\u06FF]/.test(prompt);

    let englishPrompt = prompt;

    // 2. Translate Urdu to English if needed
   
      const translationModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const translationResult = await translationModel.generateContent(
        `Translate this Urdu sentence to English only:\n"${prompt}"`
      )
      englishPrompt = translationResult.response.text().trim().replace(/(^"+|"+$)/g, '');
    console.log(englishPrompt)
   

    // 3. Get Supabase data
    const { data: supaData, error } = await supabase.from('products').select('*');
    if (error) console.error('Supabase error:', error);

    // 4. Load local JSON
    const filePath = path.join(process.cwd(), 'public', 'data', 'inventoryData.json');
    const Inventory_Reportfile=path.join(process.cwd(),'public','data','inventoryReport.json')
    const Inventory_Reportfile_data=await fs.readFile(Inventory_Reportfile,'utf8')
    const Inventory_Reportfile_Local_data=JSON.parse(Inventory_Reportfile_data)
    const fileData = await fs.readFile(filePath, 'utf-8');
    const localData = JSON.parse(fileData);

    const combinedData = [...localData,...Inventory_Reportfile_Local_data, ...(supaData ?? [])];

    // 5. Prepare Gemini chat
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat();

    const chatPrompt = `
You are an intelligent inventory assistant. Here is the current inventory data in JSON format:
${JSON.stringify(combinedData, null, 2)}

Answer the user's query using the data above in a clear, human-readable format.

Guidelines:
- DO NOT return JSON or code blocks.
- If the query asks for a specific item, return its details like: "Item ID 1234 is a Pepsi bottle, quantity 20, last updated on July 24, 2025."
- If the query asks about 'remarks', return only the remarks of the item in simple sentences.
- If the query asks about the type of an item, reply like: "Bread is a Bakery item."
- If the query asks about the quantity, reply with the exact number.
- If any items have quantity less than 10, say: "These items need restocking..."
-if user ask who created you then ,say: "I was created by M.Tauheed"
-if user ask who is Tauheed then ,say:"Tauheed is a dedicated and enthusiastic MERN Stack Developer currently pursuing his Bachelor's degree in Computer Science at COMSATS University, where he is in his 5th semester. With a keen interest in full-stack web development, Tauheed has developed a solid grasp of modern technologies such as MongoDB, Express.js, React.js, and Node.js.

He is currently interning at Largify Solutions, where he is actively involved in real-world development tasks and collaborative projects. Tauheed is known for his problem-solving mindset, willingness to learn, and strong work ethic. He consistently seeks opportunities to expand his technical skills and contribute meaningfully to the tech community.

Tauheed is open to networking, professional collaborations, and new learning experiences in the software development space.

📞 Contact: 0323-7594869"

- Use proper grammar and tone. Avoid any assumptions. Never make up data.
-always provide response in list if needed
- Be concise and helpful like a smart assistant.

User's query: "${englishPrompt}"
`;

    const result = await chat.sendMessageStream(chatPrompt);

    // 6. Stream response
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(decoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Gemini Error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
