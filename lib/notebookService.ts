import { ParsedCell, CellOutput } from "../types";

export const parseNotebook = (content: string): ParsedCell[] => {
  try {
    const json = JSON.parse(content);
    if (!json.cells || !Array.isArray(json.cells)) return [];

    return json.cells.map((cell: any, index: number) => {
      let cellType: 'code' | 'markdown' = 'markdown';
      if (cell.cell_type === 'code') cellType = 'code';
      
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
      
      const outputs: CellOutput[] = [];
      if (cell.outputs && Array.isArray(cell.outputs)) {
        cell.outputs.forEach((out: any) => {
           if (out.output_type === 'stream') {
             outputs.push({
               type: 'text',
               data: Array.isArray(out.text) ? out.text.join('') : out.text
             });
           } else if (out.output_type === 'execute_result' || out.output_type === 'display_data') {
             if (out.data['image/png']) {
               outputs.push({
                 type: 'image',
                 mimeType: 'image/png',
                 data: out.data['image/png']
               });
             } else if (out.data['image/jpeg']) {
               outputs.push({
                 type: 'image',
                 mimeType: 'image/jpeg',
                 data: out.data['image/jpeg']
               });
             } else if (out.data['text/html']) {
               outputs.push({
                 type: 'html',
                 data: Array.isArray(out.data['text/html']) ? out.data['text/html'].join('') : out.data['text/html']
               });
             } else if (out.data['text/plain']) {
               outputs.push({
                 type: 'text',
                 data: Array.isArray(out.data['text/plain']) ? out.data['text/plain'].join('') : out.data['text/plain']
               });
             }
           } else if (out.output_type === 'error') {
             outputs.push({
               type: 'error',
               data: `${out.ename}: ${out.evalue}\n${Array.isArray(out.traceback) ? out.traceback.join('\n') : out.traceback}`
             });
           }
        });
      }

      return {
        id: `cell-${index}`,
        type: cellType,
        content: source,
        executionCount: cell.execution_count,
        outputs: outputs
      };
    });
  } catch (e) {
    console.error("Failed to parse notebook", e);
    return [];
  }
};