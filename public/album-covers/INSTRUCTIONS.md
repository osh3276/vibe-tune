# Sample Album Covers

To use the 4-row unique image system, add your album cover images here with the following naming pattern:

## File Names for Unique Rows:
**Rows 1 & 2 (Top two rows):**
- album-1.jpg through album-25.jpg

**Rows 3 & 4 (Bottom two rows):**
- album-26.jpg through album-50.jpg

## Complete Setup:
1. Add 50 total images to this folder
2. Name them album-1.jpg through album-50.jpg
3. Rows 1&2 will show albums 1-25 (repeating across the row)
4. Rows 3&4 will show albums 26-50 (repeating across the row)
5. All rows move at different speeds for dynamic effect

## Quick Test:
1. Add your first 25 images as album-1.jpg through album-25.jpg
2. Add your next 25 images as album-26.jpg through album-50.jpg
3. Refresh your page to see unique images in each row pair!

## Advanced Usage:
If you want to use a different naming convention, you can modify the `getImageName()` function in `/src/lib/albumConfig.ts`
