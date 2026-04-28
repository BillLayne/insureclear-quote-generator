import React from 'react';
import { InsuranceData } from '../types';
import { generateInsuranceHtml } from '../utils/htmlGenerator';

interface Props {
  data: InsuranceData;
}

const PreviewTemplate: React.FC<Props> = ({ data }) => {
  const htmlContent = generateInsuranceHtml(data);

  return (
    <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden bg-white">
      <div className="bg-gray-100 p-2 text-xs text-center text-gray-500 border-b">
        Preview Mode (Scaled Down)
      </div>
      <div className="relative w-full h-[600px] overflow-y-auto">
         {/* 
            We use an iframe to isolate the styles of the template from the styles of the React app.
            This ensures the preview looks exactly like the downloaded file.
         */}
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full"
          title="Template Preview"
          style={{ minHeight: '800px' }}
        />
      </div>
    </div>
  );
};

export default PreviewTemplate;