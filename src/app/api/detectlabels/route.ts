import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export async function POST(req: Request) { // has to take in a request cannot just put in the image path
  try {
    const { imagepath } = await req.json();

    if (!imagepath) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // actual label detection
    const [result] = await client.labelDetection(imagepath);
    // lowkey, do they come with multiple labels - 90% YES - YES
    const labels = result.labelAnnotations?.map((label) => label.description) || []; // we need to just extract the description 

    return NextResponse.json( labels , { status: 200 });
  } catch (error) {
    console.error('Error detecting labels:', error);
    return NextResponse.json({ error: 'Failed to detect labels' }, { status: 500 });
  }
}
