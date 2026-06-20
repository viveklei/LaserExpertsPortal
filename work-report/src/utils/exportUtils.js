import * as XLSX from 'xlsx';

/**
 * Excel Export Utility using SheetJS
 */
export const downloadExcel = (history) => {
    if (!history || history.length === 0) {
        alert("No history to export!");
        return;
    }

    try {
        // 1. Prepare Data for SheetJS
        const data = history.flatMap(entry => {
            const tasks = entry.data || [];
            
            // If no processed tasks, fall back to a single row for the entry
            if (tasks.length === 0) {
                return [{
                    'Date': entry.date,
                    'Time Slot': 'N/A',
                    'Category': entry.category,
                    'Work Accomplishment': entry.input
                }];
            }

            // Create a row for each task
            return tasks.map(task => ({
                'Date': entry.date,
                'Time Slot': task.timestamp || 'N/A',
                'Category': task.category || entry.category,
                'Work Accomplishment': task.expanded || task.text || ''
            }));
        });

        // 2. Create a new Workbook
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Work Reports");

        // 3. Set column widths for better readability
        const wscols = [
            { wch: 15 }, // Date
            { wch: 25 }, // Time Slot
            { wch: 20 }, // Category
            { wch: 80 }, // Work Accomplishment (wider)
        ];
        worksheet['!cols'] = wscols;

        // 4. Generate and download the file
        // XLSX.writeFile handles the blob creation and triggering the download
        XLSX.writeFile(workbook, `LEI_Work_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Failed to export Excel sheet. Please try again.");
    }
};
