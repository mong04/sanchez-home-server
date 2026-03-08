import React, { useState, useRef } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { useAddTransaction, useAccounts } from '../../../hooks/useFinanceData';
import { AlertCircle, UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '../../../lib/utils';

interface ImportTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportTransactionModal: React.FC<ImportTransactionModalProps> = ({ isOpen, onClose }) => {
    const addTransaction = useAddTransaction();
    const { data: accounts } = useAccounts();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [accountId, setAccountId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Please upload a valid CSV file.');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleImport = async () => {
        if (!accountId) return setError('Please select an account for these transactions.');
        if (!file) return setError('Please select a CSV file.');

        setIsProcessing(true);
        setError('');
        setSuccessCount(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                let importedRows = 0;
                const parseErrors: string[] = [];

                // Simple expected format: Date, Payee, Amount, Notes
                for (const row of results.data as any[]) {
                    try {
                        const amountStr = row.Amount || row.amount || '0';
                        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));

                        if (isNaN(amount) || amount === 0) continue;

                        const dateStr = row.Date || row.date || new Date().toISOString();
                        const payee = row.Payee || row.payee || row.Description || row.description || 'Unknown Payee';
                        const notes = row.Notes || row.notes || row.Memo || row.memo || '';

                        await addTransaction.mutateAsync({
                            account: accountId,
                            amount: amount,
                            date: new Date(dateStr).toISOString(),
                            payee: payee,
                            notes: notes,
                            cleared: true,
                            isIncome: amount > 0,
                        });
                        importedRows++;
                    } catch (err) {
                        parseErrors.push(`Failed to import row: ${JSON.stringify(row)}`);
                    }
                }

                setIsProcessing(false);
                if (importedRows > 0) {
                    setSuccessCount(importedRows);
                    setTimeout(() => {
                        handleClose();
                    }, 2000);
                } else {
                    setError('No valid transactions found in the CSV. Please check the columns (Date, Payee, Amount).');
                }
            },
            error: (err) => {
                setIsProcessing(false);
                setError(`Error reading file: ${err.message}`);
            }
        });
    };

    const handleClose = () => {
        setFile(null);
        setAccountId('');
        setError('');
        setSuccessCount(null);
        setIsProcessing(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Transactions"
            description="Upload a CSV file from your bank to bulk import transactions."
        >
            <div className="space-y-6 mt-2">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {successCount !== null && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-8 h-8" />
                        <p className="font-medium text-lg">Success!</p>
                        <p className="text-sm border-t border-success/20 pt-2 w-full text-center">
                            Successfully imported {successCount} transactions.
                        </p>
                    </div>
                )}

                {successCount === null && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Destination Account</label>
                            <select
                                className="flex min-h-[44px] md:min-h-0 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 appearance-none transition-shadow"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="" disabled>Select account...</option>
                                {accounts?.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Upload CSV File</label>
                            <div
                                className={cn(
                                    "mt-2 flex justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                                    isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-muted-foreground/30 hover:bg-muted/10",
                                    file ? "bg-muted/30 border-solid" : ""
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="text-center">
                                    {file ? (
                                        <div className="flex flex-col items-center gap-2 text-primary animate-in fade-in zoom-in duration-300">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                                <FileSpreadsheet className="w-6 h-6" />
                                            </div>
                                            <div className="flex text-sm font-medium text-foreground">
                                                <span>{file.name}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[44px] md:min-h-0"
                                                onClick={() => setFile(null)}
                                            >
                                                Remove File
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                                                <UploadCloud className="mx-auto h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <div className="mt-2 flex text-sm leading-6 text-muted-foreground">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80 transition-colors"
                                                >
                                                    <span>Upload a file</span>
                                                    <input
                                                        id="file-upload"
                                                        name="file-upload"
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="sr-only"
                                                        accept=".csv"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs leading-5 text-muted-foreground">
                                                CSV files only
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg flex items-start gap-2 mt-4">
                                <div className="mt-0.5">•</div>
                                <div>Your CSV must have rows with <span className="font-semibold text-foreground">Date</span>, <span className="font-semibold text-foreground">Payee</span>, and <span className="font-semibold text-foreground">Amount</span> headers.</div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isProcessing} className="min-h-[44px] md:min-h-0">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || !accountId || isProcessing}
                                className="min-h-[44px] md:min-h-0"
                            >
                                {isProcessing ? 'Importing...' : 'Complete Import'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
