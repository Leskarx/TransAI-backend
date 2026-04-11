import { processPDF } from "../services/pdf.service.js";

export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pdfBuffer = req.file.buffer;

    const resultBuffer = await processPDF(pdfBuffer);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=translated.pdf",
    });

    res.send(Buffer.from(resultBuffer));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
};