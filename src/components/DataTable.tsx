import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaFilter, FaChevronLeft, FaChevronRight, FaTrash, FaPlus, FaEdit } from 'react-icons/fa';
import type { Transacao } from '../config';
import { capitalize } from '../utils/capitalize';

interface DataTableProps {
  data: Transacao[];
  isDark: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (transacao: Transacao) => void;
  onNewTransaction?: () => void;
  formatarMoeda: (valor: number) => string;
  formatarData: (data: string) => string;
  // Paginação server-side
  total?: number;
  pageCount?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  manualPagination?: boolean;
}

export function DataTable({
  data,
  isDark,
  onDelete,
  onEdit,
  onNewTransaction,
  formatarMoeda,
  formatarData,
  total,
  pageCount,
  onPaginationChange,
  manualPagination = false,
}: DataTableProps) {
  // Ordenação padrão: mais recentes primeiro (por dataHora desc)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dataHora', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Handler para mudanças de paginação
  const handlePaginationChange = (updater: any) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setPagination(newPagination);
    
    // Se há callback e paginação manual, chama o callback
    if (manualPagination && onPaginationChange) {
      onPaginationChange(newPagination.pageIndex, newPagination.pageSize);
    }
  };

  const columns = useMemo<ColumnDef<Transacao>[]>(
    () => [
      {
        accessorKey: 'dataHora',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Data/Hora
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">{formatarData(row.original.dataHora)}</div>
        ),
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          const dateStr = formatarData(row.original.dataHora).toLowerCase();
          return dateStr.includes(value.toLowerCase());
        },
      },
      {
        accessorKey: 'descricao',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Descrição
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm font-medium">{capitalize(row.original.descricao)}</div>
        ),
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          return row.original.descricao.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: 'tipo',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Tipo
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const tipo = row.original.tipo;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                tipo === 'entrada'
                  ? isDark
                    ? 'bg-green-900 text-green-200'
                    : 'bg-green-100 text-green-800'
                  : isDark
                  ? 'bg-red-900 text-red-200'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          );
        },
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          if (value === 'all') return true;
          return row.original.tipo === value;
        },
      },
      {
        accessorKey: 'metodo',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Método
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const metodo = row.original.metodo;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                metodo === 'credito'
                  ? isDark
                    ? 'bg-primary-900 text-primary-200'
                    : 'bg-primary-100 text-primary-800'
                  : isDark
                  ? 'bg-purple-900 text-purple-200'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {metodo === 'credito' ? 'Crédito' : 'Débito'}
            </span>
          );
        },
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          if (value === 'all') return true;
          return row.original.metodo === value;
        },
      },
      {
        accessorKey: 'carteira',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Carteira
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const carteira = row.original.carteira;
          if (!carteira) {
            return (
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Sem carteira
              </span>
            );
          }
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{carteira.nome}</span>
              {carteira.tipo && (
                <span
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {carteira.tipo === 'credito' ? 'Crédito' : 'Débito'}
                </span>
              )}
            </div>
          );
        },
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          if (!value) return true;
          const carteira = row.original.carteira;
          if (!carteira) return false;
          return carteira.nome.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: 'categoria',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            Categoria
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const categoria = row.original.categoria || 'outros';
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'
              }`}
            >
              {capitalize(categoria)}
            </span>
          );
        },
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          if (value === 'all' || !value) return true;
          return (row.original.categoria || 'outros').toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        accessorKey: 'valor',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity ml-auto"
          >
            Valor
            {column.getIsSorted() === 'asc' ? (
              <FaSortUp size={12} />
            ) : column.getIsSorted() === 'desc' ? (
              <FaSortDown size={12} />
            ) : (
              <FaSort size={12} className="opacity-30" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const transacao = row.original;
          return (
            <div
              className={`text-sm font-semibold text-right ${
                transacao.tipo === 'entrada'
                  ? isDark
                    ? 'text-green-400'
                    : 'text-green-600'
                  : isDark
                  ? 'text-red-400'
                  : 'text-red-600'
              }`}
            >
              {transacao.tipo === 'entrada' ? '+' : '-'}
              {formatarMoeda(transacao.valor)}
            </div>
          );
        },
        enableColumnFilter: true,
        filterFn: (row, _id, value) => {
          if (!value) return true;
          const numValue = parseFloat(value);
          if (isNaN(numValue)) return true;
          return row.original.valor >= numValue;
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => {
          if (!row.original.id) return null;
          return (
            <div className="flex justify-center gap-2">
              {onEdit && (
                <motion.button
                  onClick={() => onEdit(row.original)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-primary-400 hover:bg-primary-900/20 hover:text-primary-300'
                      : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                  title="Editar transação"
                >
                  <FaEdit size={16} />
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  onClick={() => onDelete(row.original.id!)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                  title="Excluir transação"
                >
                  <FaTrash size={16} />
                </motion.button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [isDark, formatarMoeda, formatarData, onDelete, onEdit]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: manualPagination,
    pageCount: manualPagination && pageCount !== undefined ? pageCount : undefined,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });


  return (
    <div className={`rounded-lg sm:rounded-xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Transações
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {manualPagination && total !== undefined
                ? `Mostrando ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total)} de ${total} transação(ões)`
                : `Mostrando ${table.getFilteredRowModel().rows.length} de ${data.length} transação(ões)`
              }
            </p>
          </div>
          {onNewTransaction && (
            <motion.button
              onClick={onNewTransaction}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <FaPlus size={14} />
              Nova Transação
            </motion.button>
          )}
        </div>

        {/* Filtros Globais e por Coluna */}
        <div className="mt-4 space-y-3">
          {/* Busca Global */}
          <div className="relative">
            <FaSearch
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar em todas as colunas..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark
                  ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Filtros por Coluna */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro Tipo */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tipo
              </label>
              <select
                value={(table.getColumn('tipo')?.getFilterValue() as string) || 'all'}
                onChange={(e) => {
                  const column = table.getColumn('tipo');
                  if (e.target.value === 'all') {
                    column?.setFilterValue(undefined);
                  } else {
                    column?.setFilterValue(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            {/* Filtro Método */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Método
              </label>
              <select
                value={(table.getColumn('metodo')?.getFilterValue() as string) || 'all'}
                onChange={(e) => {
                  const column = table.getColumn('metodo');
                  if (e.target.value === 'all') {
                    column?.setFilterValue(undefined);
                  } else {
                    column?.setFilterValue(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">Todos</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
              </select>
            </div>

            {/* Filtro Categoria */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Categoria
              </label>
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={(table.getColumn('categoria')?.getFilterValue() as string) || ''}
                onChange={(e) => {
                  const column = table.getColumn('categoria');
                  if (!e.target.value) {
                    column?.setFilterValue(undefined);
                  } else {
                    column?.setFilterValue(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Filtro Valor Mínimo */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Valor Mínimo
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={(table.getColumn('valor')?.getFilterValue() as string) || ''}
                onChange={(e) => {
                  const column = table.getColumn('valor');
                  if (!e.target.value) {
                    column?.setFilterValue(undefined);
                  } else {
                    column?.setFilterValue(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {(globalFilter || columnFilters.length > 0) && (
            <motion.button
              onClick={() => {
                setGlobalFilter('');
                setColumnFilters([]);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <FaFilter size={14} />
              Limpar Filtros
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-slate-300' : 'text-slate-500'
                    }`}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={`divide-y ${isDark ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-slate-200'}`}>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={`px-4 lg:px-6 py-8 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  Nenhuma transação encontrada
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-4 lg:px-6 py-4 whitespace-nowrap ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className={`p-4 sm:p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {manualPagination && total !== undefined
            ? `Mostrando ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, total)} de ${total} transações`
            : `Mostrando ${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de ${table.getFilteredRowModel().rows.length} transações`
          }
        </div>

        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className={`px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
            }`}
          >
            {[5, 10, 15, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} por página
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              whileHover={{ scale: table.getCanPreviousPage() ? 1.05 : 1 }}
              whileTap={{ scale: table.getCanPreviousPage() ? 0.95 : 1 }}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FaChevronLeft size={14} />
            </motion.button>

            <span className={`px-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Página {table.getState().pagination.pageIndex + 1} de {manualPagination && pageCount !== undefined ? pageCount : table.getPageCount()}
            </span>

            <motion.button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              whileHover={{ scale: table.getCanNextPage() ? 1.05 : 1 }}
              whileTap={{ scale: table.getCanNextPage() ? 0.95 : 1 }}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FaChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
