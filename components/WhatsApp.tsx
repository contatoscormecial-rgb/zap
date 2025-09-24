
import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { WhatsAppNumber } from '../types';

// --- MODAL COMPONENTS ---

const EditNumberModal: React.FC<{
    number: WhatsAppNumber;
    onSave: (number: WhatsAppNumber) => Promise<void>;
    onClose: () => void;
}> = ({ number, onSave, onClose }) => {
    const [formData, setFormData] = useState(number);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-zap-card-blue rounded-lg p-6 w-full max-w-lg border border-gray-200 dark:border-zap-border-blue">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-zap-text-primary mb-4">Editar Número</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="edit-name" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Nome</label>
                        <input type="text" id="edit-name" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div>
                        <label htmlFor="edit-number" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Número</label>
                        <input type="text" id="edit-number" name="number" value={formData.number} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="bg-zap-green-light text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500">
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<{
    number: WhatsAppNumber;
    onDelete: () => void;
    onClose: () => void;
}> = ({ number, onDelete, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-zap-card-blue rounded-lg p-6 w-full max-w-sm border border-gray-200 dark:border-zap-border-blue">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-zap-text-primary mb-2">Confirmar Exclusão</h2>
                <p className="text-gray-500 dark:text-zap-text-secondary mb-6">
                    Tem certeza que deseja apagar o número de <span className="font-bold text-gray-800 dark:text-zap-text-primary">{number.name}</span> ({number.number})? Esta ação não pode ser desfeita.
                </p>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-zap-border-blue text-gray-800 dark:text-zap-text-primary px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                    <button type="button" onClick={onDelete} className="bg-zap-red text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors">
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

const WhatsApp: React.FC = () => {
    const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [newIsActive, setNewIsActive] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [editingNumber, setEditingNumber] = useState<WhatsAppNumber | null>(null);
    const [deletingNumber, setDeletingNumber] = useState<WhatsAppNumber | null>(null);

    const fetchNumbers = async () => {
        setLoading(true);
        setError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("Usuário não autenticado.");
            setLoading(false);
            return;
        }

        const { data, error: fetchError } = await supabase
            .from('whatsapp_numbers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching WhatsApp numbers:', fetchError);
            setError("Não foi possível carregar os números. Verifique se a tabela 'whatsapp_numbers' existe.");
        } else {
            setNumbers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNumbers();
    }, []);
    
    const handleAddNumber = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Sessão expirada. Faça login novamente.");
            setIsAdding(false);
            return;
        }

        const { error: insertError } = await supabase.from('whatsapp_numbers').insert({
            name: newName,
            number: newNumber,
            is_active: newIsActive,
            user_id: user.id
        });

        if (insertError) {
            console.error('Error adding number:', insertError);
            alert(`Erro ao adicionar número: ${insertError.message}`);
        } else {
            setNewName('');
            setNewNumber('');
            setNewIsActive(true);
            await fetchNumbers();
        }
        setIsAdding(false);
    };

    const handleToggleActive = async (number: WhatsAppNumber) => {
        const { error: updateError } = await supabase
            .from('whatsapp_numbers')
            .update({ is_active: !number.is_active })
            .eq('id', number.id);
        
        if (updateError) {
            alert(`Erro ao atualizar status: ${updateError.message}`);
        } else {
            await fetchNumbers();
        }
    };

    const handleUpdateNumber = async (updatedNumber: WhatsAppNumber) => {
        const { id, user_id, created_at, updated_at, ...updateData } = updatedNumber;

        const { error: updateError } = await supabase
            .from('whatsapp_numbers')
            .update(updateData)
            .eq('id', id);
        
        if (updateError) {
            alert(`Erro ao editar número: ${updateError.message}`);
        } else {
            setEditingNumber(null);
            await fetchNumbers();
        }
    };

    const handleDeleteNumber = async () => {
        if (!deletingNumber) return;

        const { error: deleteError } = await supabase
            .from('whatsapp_numbers')
            .delete()
            .eq('id', deletingNumber.id);
        
        if (deleteError) {
            alert(`Erro ao apagar número: ${deleteError.message}`);
        } else {
            setDeletingNumber(null);
            await fetchNumbers();
        }
    };

    return (
      <>
        {editingNumber && <EditNumberModal number={editingNumber} onSave={handleUpdateNumber} onClose={() => setEditingNumber(null)} />}
        {deletingNumber && <DeleteConfirmModal number={deletingNumber} onDelete={handleDeleteNumber} onClose={() => setDeletingNumber(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title="Adicionar Número">
                    <form onSubmit={handleAddNumber} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Nome</label>
                            <input type="text" id="name" placeholder="Ex: Contato Principal" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                        <div>
                            <label htmlFor="number" className="text-sm font-medium text-gray-500 dark:text-zap-text-secondary block mb-1">Número</label>
                            <input type="text" id="number" placeholder="Ex: 5511999998888" value={newNumber} onChange={e => setNewNumber(e.target.value)} required className="w-full bg-gray-50 dark:bg-zap-dark-blue border border-gray-300 dark:border-zap-border-blue rounded-md py-2 px-3 text-gray-900 dark:text-zap-text-primary text-sm focus:ring-zap-green-light focus:border-zap-green-light" />
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-zap-dark-blue p-3 rounded-md border border-gray-200 dark:border-zap-border-blue">
                             <label htmlFor="isActive" className="text-sm font-medium text-gray-800 dark:text-zap-text-primary">Ativo</label>
                             <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="isActive" id="isActive" checked={newIsActive} onChange={() => setNewIsActive(!newIsActive)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-400 border-4 appearance-none cursor-pointer"/>
                                <label htmlFor="isActive" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 dark:bg-zap-border-blue cursor-pointer"></label>
                             </div>
                        </div>
                        <style>{`.toggle-checkbox:checked { right: 0; border-color: #22C55E; background-color: white!important; } .toggle-checkbox:checked + .toggle-label { background-color: #22C55E; }`}</style>
                        <button type="submit" disabled={isAdding} className="w-full bg-zap-green-light text-white font-semibold py-2.5 rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isAdding ? 'Adicionando...' : 'Adicionar Número'}
                        </button>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-zap-text-primary mb-4">Números Cadastrados</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-zap-text-secondary">
                            <thead className="text-xs text-gray-700 dark:text-zap-text-secondary uppercase bg-gray-100 dark:bg-zap-dark-blue">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Nome</th>
                                    <th scope="col" className="px-4 py-3">Número</th>
                                    <th scope="col" className="px-4 py-3">Status</th>
                                    <th scope="col" className="px-4 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={4} className="text-center py-4 text-red-500">{error}</td></tr>
                                ) : numbers.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-4">Nenhum número cadastrado.</td></tr>
                                ) : numbers.map(n => (
                                    <tr key={n.id} className="bg-white dark:bg-zap-card-blue border-b border-gray-200 dark:border-zap-border-blue hover:bg-gray-50 dark:hover:bg-zap-border-blue/50">
                                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-zap-text-primary whitespace-nowrap">{n.name}</td>
                                        <td className="px-4 py-4">{n.number}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${n.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'}`}>
                                                {n.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 flex items-center space-x-3">
                                            <button onClick={() => setEditingNumber(n)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Editar</button>
                                            <button onClick={() => handleToggleActive(n)} className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium">{n.is_active ? 'Desativar' : 'Ativar'}</button>
                                            <button onClick={() => setDeletingNumber(n)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">Apagar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
      </>
    );
};

export default WhatsApp;
