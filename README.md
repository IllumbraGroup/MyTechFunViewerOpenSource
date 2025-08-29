


# MyTechFun Filament Viewer V2

A modern web application for analyzing and comparing 3D printer filament properties from MyTechFun Excel files. This version focuses on easy and effortless comparison of filament properties with interactive visualizations.


![Bildschirmaufnahme 2025-08-29 um 10 34 50](https://github.com/user-attachments/assets/32b94b53-7b62-471d-a334-0ac7699de401)




## Features

### 🔬 Data Analysis
- **Excel File Upload**: Drag & drop support for MyTechFun .xlsx files
- **Data Validation**: Automatic validation of required columns and data integrity
- **Statistical Analysis**: Correlation analysis, regression, and descriptive statistics

### 📊 Interactive Visualizations
- **Scatter Plots**: Compare any two properties with correlation analysis and regression lines
- **Bar Charts**: Normalized comparison by base material (PLA, PETG, ABS, etc.)
- **Radar Charts**: Multi-property comparison of top-performing filaments

### 🔍 Advanced Filtering
- **Multi-select Filters**: Brand, filament type, base material, fiber blend
- **Numeric Range Filters**: Filter by any numeric property (tensile strength, temperature, etc.)
- **Real-time Search**: Global text search across all properties

### 📱 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Collapsible Sidebar**: Maximize visualization space
- **Data Persistence**: Automatically saves your last dataset

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### Usage

1. **Upload Data**: Drag and drop your MyTechFun Excel file onto the upload area
2. **Apply Filters**: Use the sidebar to filter by brand, material, or numeric ranges
3. **Visualize**: Switch between table view and interactive charts
4. **Compare**: Use scatter plots to find correlations, bar charts for material comparison, or radar charts for top performers

## Excel File Format

Your Excel file should contain columns such as:
- Brand
- Filament Type
- Base Material
- Fiber Blend
- Tensile Strength (kg)
- Layer Adhesion (kg)
- IZOD Impact Test (kJ/m²)
- Flexural Modulus
- Deformation Temperature (°C)
- Shear Stress (kg)
- Torque (Nm)
- Price

## Technical Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Excel Parsing**: SheetJS (xlsx)
- **File Upload**: React Dropzone

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Project Structure
```
src/
├── components/          # React components
│   ├── FileUpload.tsx   # File upload interface
│   ├── FilterPanel.tsx  # Advanced filtering sidebar
│   ├── DataTable.tsx    # Sortable data table
│   └── Charts.tsx       # Chart visualizations
├── utils/               # Utility functions
│   ├── excel.ts         # Excel parsing and validation
│   └── statistics.ts    # Statistical calculations
├── types.ts             # TypeScript type definitions
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Data Privacy

- All data processing happens locally in your browser
- No data is sent to external servers
- Excel files are processed client-side only
- Data persistence uses browser's local storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This project is for analyzing MyTechFun filament testing data. Please ensure you have appropriate rights to the Excel files you upload.
