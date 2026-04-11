// export const translateBatch = async (texts) => {
//   const SEPARATOR = "___UNIQUE_SPLIT_123___";
//   const combinedText = texts.join(` ${SEPARATOR} `);

//   try {
//     const res = await fetch(
//       "https://translateai.p.rapidapi.com/google/translate/json",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-rapidapi-key": process.env.RAPID_API_KEY,
//           "x-rapidapi-host": "translateai.p.rapidapi.com",
//         },
//         body: JSON.stringify({
//           origin_language: "auto", // 🔥 FIXED
//           target_language: "as",
//           words_not_to_translate: "",
//           paths_to_exclude: "",
//           common_keys_to_exclude: "",
//           json_content: {
//             text: combinedText,
//           },
//         }),
//       }
//     );

//     const data = await res.json();

//     console.log("TRANSLATION RESPONSE:", data);

//     const translatedCombined =
//       data?.translated_json?.text || combinedText;

//     return translatedCombined.split(` ${SEPARATOR} `);

//   } catch (error) {
//     console.error("Translation error:", error);
//     return texts;
//   }
// };

// translate.service.js
export const translateBatch = async (texts) => {
  const SEPARATOR = "___UNIQUE_SPLIT_123___";
  const combinedText = texts.join(` ${SEPARATOR} `);

  try {
    const res = await fetch(
      "https://translateai.p.rapidapi.com/google/translate/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "translateai.p.rapidapi.com",
        },
        body: JSON.stringify({
          origin_language: "auto",
          target_language: "as",
          words_not_to_translate: "",
          paths_to_exclude: "",
          common_keys_to_exclude: "",
          json_content: {
            text: combinedText,
          },
        }),
      }
    );

    const data = await res.json();
    
    console.log("Raw translation response:", JSON.stringify(data, null, 2));
    
    const translatedCombined = data?.translated_json?.text || combinedText;
    
    // IMPORTANT: Decode any escaped Unicode sequences
    const decodedText = decodeUnicodeEscapes(translatedCombined);
    
    // Normalize to ensure proper Unicode composition
    const normalizedText = decodedText.normalize('NFC');
    
    return normalizedText.split(` ${SEPARATOR} `);

  } catch (error) {
    console.error("Translation error:", error);
    return texts;
  }
};

// Helper function to decode Unicode escape sequences
function decodeUnicodeEscapes(text) {
  return text.replace(/\\u([0-9A-Fa-f]{4})/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
}