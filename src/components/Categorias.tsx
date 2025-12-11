import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Categoria } from '../config';
import { motion } from 'framer-motion';
import { FaTag, FaPlus, FaEdit, FaTrash, FaLock } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';

interface CategoriasProps {
  isDark: boolean;
}

export function Categorias({ isDark }: CategoriasProps) {
  const { showSuccess, showError, showWarning, confirm } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida' | 'ambos'>('todos');
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#00C853',
    tipo: 'saida' as 'entrada' | 'saida' | 'ambos',
  });

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const response = await api.buscarCategorias();
      if (response.success) {
        setCategorias(response.categorias || []);
      }
    } catch (error: any) {
      showError('Erro ao carregar categorias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      showError('Nome da categoria é obrigatório');
      return;
    }

    try {
      if (editando) {
        await api.atualizarCategoria(editando.id, formData);
        showSuccess('Categoria atualizada com sucesso!');
      } else {
        await api.criarCategoria(formData);
        showSuccess('Categoria criada com sucesso!');
      }
      
      setMostrarForm(false);
      setEditando(null);
      setFormData({ nome: '', descricao: '', cor: '#00C853', tipo: 'saida' });
      await carregarCategorias();
    } catch (error: any) {
      showError('Erro ao salvar categoria: ' + error.message);
    }
  };

  const handleEditar = (categoria: Categoria) => {
    if (categoria.padrao) {
      showWarning('Não é possível editar categorias padrão');
      return;
    }
    setEditando(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      cor: categoria.cor || '#00C853',
      tipo: categoria.tipo,
    });
    setMostrarForm(true);
  };

  const handleRemover = async (id: number, padrao: boolean) => {
    if (padrao) {
      showWarning('Não é possível remover categorias padrão');
      return;
    }

    const confirmar = await confirm({
      title: 'Remover Categoria',
      message: 'Tem certeza que deseja remover esta categoria?',
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => {},
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.removerCategoria(id);
      showSuccess('Categoria removida com sucesso!');
      await carregarCategorias();
    } catch (error: any) {
      showError('Erro ao remover categoria: ' + error.message);
    }
  };

  const categoriasFiltradas = categorias.filter(cat => {
    if (filtroTipo === 'todos') return true;
    return cat.tipo === filtroTipo || cat.tipo === 'ambos';
  });

  const categoriasPadrao = categoriasFiltradas.filter(c => c.padrao);
  const categoriasPersonalizadas = categoriasFiltradas.filter(c => !c.padrao);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedIcon>
                <FaTag className="text-primary-600" size={28} />
              </AnimatedIcon>
              Categorias
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Gerencie suas categorias de transações
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Filtros */}
            {(['todos', 'entrada', 'saida', 'ambos'] as const).map((tipo) => (
              <motion.button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroTipo === tipo
                    ? isDark
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-600 text-white'
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo === 'entrada' ? 'Entradas' : tipo === 'saida' ? 'Saídas' : 'Ambos'}
              </motion.button>
            ))}

            {/* Botão Adicionar */}
            {!mostrarForm && (
              <motion.button
                onClick={() => {
                  setEditando(null);
                  setFormData({ nome: '', descricao: '', cor: '#00C853', tipo: 'saida' });
                  setMostrarForm(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${
                  isDark
                    ? 'bg-brand-dark hover:bg-brand text-white'
                    : 'bg-brand hover:bg-brand-dark text-white'
                }`}
              >
                <FaPlus size={14} />
                Nova Categoria
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {editando ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Descrição
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Cor
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10 w-20 rounded border"
                  />
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    placeholder="#00C853"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                  isDark
                    ? 'bg-brand-dark hover:bg-brand text-white'
                    : 'bg-brand hover:bg-brand-dark text-white'
                }`}
              >
                {editando ? 'Atualizar' : 'Criar'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  setEditando(null);
                  setFormData({ nome: '', descricao: '', cor: '#00C853', tipo: 'saida' });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Lista de Categorias */}
      {loading ? (
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando categorias...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categorias Padrão */}
          {categoriasPadrao.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Categorias Padrão
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriasPadrao.map((categoria) => (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl shadow-sm p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: categoria.cor || '#00C853' }}
                          />
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {categoria.nome}
                          </h4>
                          <FaLock className="text-slate-400" size={12} />
                        </div>
                        {categoria.descricao && (
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {categoria.descricao}
                          </p>
                        )}
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          categoria.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : categoria.tipo === 'saida'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {categoria.tipo === 'entrada' ? 'Entrada' : categoria.tipo === 'saida' ? 'Saída' : 'Ambos'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Categorias Personalizadas */}
          {categoriasPersonalizadas.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Suas Categorias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriasPersonalizadas.map((categoria) => (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl shadow-sm p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: categoria.cor || '#00C853' }}
                          />
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {categoria.nome}
                          </h4>
                        </div>
                        {categoria.descricao && (
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {categoria.descricao}
                          </p>
                        )}
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          categoria.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : categoria.tipo === 'saida'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {categoria.tipo === 'entrada' ? 'Entrada' : categoria.tipo === 'saida' ? 'Saída' : 'Ambos'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleEditar(categoria)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <FaEdit size={14} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleRemover(categoria.id, categoria.padrao)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-800'
                              : 'bg-red-50 hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <FaTrash size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {categoriasFiltradas.length === 0 && (
            <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Nenhuma categoria encontrada.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

