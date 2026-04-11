// export function groupTextItems(items) {
//     const lines = [];
  
//     items.forEach((item) => {
//       let found = false;
  
//       for (let line of lines) {
//         if (
//           line.page === item.page &&
//           Math.abs(line.y - item.y) < 5
//         ) {
//           line.text += " " + item.text;
//           line.items.push(item);
//           found = true;
//           break;
//         }
//       }
  
//       if (!found) {
//         lines.push({
//           text: item.text,
//           y: item.y,
//           page: item.page,
//           items: [item],
//         });
//       }
//     });
  
//     return lines;
//   }
  
// utils/groupText.js
export function groupTextItems(items) {
  const lines = [];
  
  items.forEach((item) => {
    let found = false;
    
    for (let line of lines) {
      // Same page and similar vertical position
      if (
        line.page === item.page &&
        Math.abs(line.y - item.y) < 5
      ) {
        // Check horizontal distance
        const lastItem = line.items[line.items.length - 1];
        const horizontalGap = item.x - (lastItem.x + (lastItem.width || 0));
        
        // If items are close enough horizontally, they're part of the same line
        if (horizontalGap < 20 && horizontalGap > -5) {
          line.text += " " + item.text;
          line.items.push(item);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      lines.push({
        text: item.text,
        y: item.y,
        page: item.page,
        items: [item],
      });
    }
  });
  
  return lines;
}