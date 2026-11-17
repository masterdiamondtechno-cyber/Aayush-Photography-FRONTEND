/**
 * DataTable component for listing records - Luxury Dark Gold Theme
 */
const DataTable = ({ headers, data, renderRow }) => {
  return (
    <div className="w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-[#262626] bg-[#141414] shadow-lg [scrollbar-width:thin]">
      <table className="min-w-[700px] w-full border-collapse text-left text-sm text-[#CCCCCC]">
        <thead>
          <tr className="bg-[#191919] border-b border-[#262626]">
            {headers.map((header, index) => (
              <th key={index} className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-[#FFC629]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222222]">
          {data.length > 0 ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-20 text-center font-medium text-[#777777]">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
