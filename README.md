# MyTechFun Filament Viewer

A web application for analyzing 3D printer filament properties from MyTechFun Excel files.

![Bildschirmaufnahme 2025-08-29 um 10 34 50 2](https://github.com/user-attachments/assets/b7454504-56d4-4a3a-a17f-620d9d37f83a)

## Features

- **Upload Excel Files**: Drag & drop MyTechFun .xlsx files
- **Interactive Table**: Sort, filter, and select data rows
- **Charts**: Scatter plots, bar charts, and radar charts
- **YouTube Links**: Click YouTube links to open videos
- **Mobile Friendly**: Works on all devices
- **Accessible**: Full keyboard navigation and screen reader support

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 and upload your Excel file

## How to Use

1. **Upload**: Drag your MyTechFun Excel file to the upload area
2. **Filter**: Use the sidebar to filter by brand, material, or properties
3. **Analyze**: Switch between table view and charts
4. **Interact**: Click table rows, sort columns, or click YouTube links

## Excel File Format

Your Excel file should include columns like:
- Brand, Filament Type, Base Material
- Tensile Strength, Layer Adhesion, IZOD Impact
- Temperature, Price, YouTube Link
- Date (automatically formatted)

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Recharts for visualizations
- Excel file processing

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code linting
```

## Privacy

All data processing happens in your browser. No files are uploaded to servers.

## License

MIT License - see [LICENSE](LICENSE) file.
