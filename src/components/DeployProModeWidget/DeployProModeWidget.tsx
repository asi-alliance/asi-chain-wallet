import React, {
    useState,
    useEffect,
    useRef,
    createContext,
    useContext,
    CSSProperties,
    useMemo,
} from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { RootState } from "store";
import { RChainService } from "services/rchain";
import { Button, PasswordModal, DeploymentConfirmationModal } from "components";
import {
    FileIcon,
    FolderIcon,
    FolderOpenIcon,
    PlusIcon,
    DownloadIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    SuccessIcon,
    ErrorIcon,
    PendingIcon,
    DeleteIcon,
} from "components/Icons";
import {
    registerRholangLanguage,
    RHOLANG_LANGUAGE_ID,
} from "./rholangLanguage";
import IDEStorageService, {
    IDEItem,
    IDEFile,
    IDEFolder,
} from "services/ideStorage";
import { SecureStorage } from "services/secureStorage";
import { getGasFeeAsNumber } from "../../constants/gas";
import { useScreen } from "hooks/";

const PENDING_TRANSACTIONS_KEY = "asi_wallet_pending_transactions";

const savePendingDeploy = (
    deployId: string,
    accountId: string,
    revAddress: string,
    expectedBalance?: string,
) => {
    if (typeof window === "undefined" || !window.localStorage) {
        return;
    }

    try {
        const existing = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
        const pendingTxs: any[] = existing ? JSON.parse(existing) : [];

        const pendingDeploy = {
            deployId,
            from: revAddress,
            timestamp: new Date().toISOString(),
            accountId,
            type: "deploy",
            expectedBalance,
        };

        const existingIndex = pendingTxs.findIndex(
            (t: any) => t.deployId === deployId,
        );
        if (existingIndex >= 0) {
            pendingTxs[existingIndex] = pendingDeploy;
        } else {
            pendingTxs.push(pendingDeploy);
        }

        localStorage.setItem(
            PENDING_TRANSACTIONS_KEY,
            JSON.stringify(pendingTxs),
        );
    } catch (error) {
        console.error("Failed to save pending deploy to localStorage:", error);
    }
};

const IDEContainer = styled.div`
    height: calc(100vh - 120px); // Account for header and nav
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
        height: auto;
    }
`;

const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.card};
    margin-bottom: 24px;

    // border-bottom: 1px solid ${({ theme }) => theme.border};

    @media (max-width: 768px) {
        margin-bottom: 36px;
    }
`;

const ToolbarActions = styled.div`
    display: flex;
    gap: 31px;
    align-items: center;
    width: 100%;

    @media (max-width: 768px) {
        margin-bottom: 1rem;
        gap: 16px;
    }
`;

const MainContent = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    width: 100%;
    gap: 24px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        display: block;
        margin-bottom: 36px;
    }
`;

const FileExplorer = styled.div`
    width: 240px;
    min-width: 240px;
    background: ${({ theme }) => theme.card};
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

const FileExplorerContent = styled.div`
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    min-height: 256px;
    height: fit-content;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

const ExplorerHeader = styled.div`
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const FileList = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const FileTree = styled.div`
    padding: 0;
`;

const TreeItem = styled.div<{ $depth: number; $active?: boolean }>`
    padding: 6px 16px;
    padding-left: ${({ $depth }) => 16 + $depth * 16}px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${({ $active, theme }) =>
        $active ? theme.primary + "20" : "transparent"};
    color: ${({ $active, theme }) =>
        $active ? theme.primary : theme.text.primary};
    border-left: 3px solid
        ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
    transition: all 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.surface};
    }

    input {
        background: ${({ theme }) => theme.surface};
        border: 1px solid ${({ theme }) => theme.primary};
        padding: 2px 4px;
        font-size: 14px;
        color: ${({ theme }) => theme.text.primary};
        outline: none;
        border-radius: 4px;
    }
`;

const TreeIcon = styled.span`
    display: flex;
    align-items: center;
    user-select: none;
`;

const EditorContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; // Prevent overflow
    overflow: hidden;

    @media (max-width: 768px) {
        height: fit-content;
    }
`;

const EditorHeader = styled.div`
    background: ${({ theme }) => theme.surface};
    // font-size: 14px;
    display: flex;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
    margin-bottom: 8px;

    &::-webkit-scrollbar {
        height: 6px;
    }
`;

const TabItem = styled.div<{ $active?: boolean }>`
    background: ${({ $active, theme }) =>
        $active ? theme.card : "transparent"};
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
        background: ${({ theme }) => theme.card};
    }
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.text.tertiary};
    cursor: pointer;
    padding: 0 4px;
    // font-size: 18px;
    line-height: 1;

    &:hover {
        color: ${({ theme }) => theme.text.primary};
    }
`;

const EditorWrapper = styled.div<{ $darkMode: boolean }>`
    flex: 1;
    position: relative;
    overflow: hidden;
    background: ${({ $darkMode }) => ($darkMode ? "#1E1E1E" : "#FFFFFF")};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    padding: 16px;

    @media (max-width: 768px) {
        height: 440px;
        flex: initial;
    }
`;

const OutputPanel = styled.div`
    height: 200px;
    background: ${({ theme }) => theme.card};
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
`;

const ConsolePanel = styled(OutputPanel)`
    background: ${({ theme }) => theme.card};
`;

const OutputHeader = styled.div`
    padding: 8px 4px;
    background: ${({ theme }) => theme.surface};
    // font-size: 14px;
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const OutputContent = styled.div`
    flex: 1;
    padding: 8px 16px;
    overflow-y: auto;
    font-size: 13px;

    padding: 16px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    min-height: 150px;
`;

const ConsoleEntry = styled.div<{ $type?: "info" | "error" | "success" }>`
    margin-bottom: 4px;
    color: ${({ theme, $type }) =>
        $type === "error"
            ? theme.danger
            : $type === "success"
              ? theme.success
              : theme.text.secondary};
    display: flex;
    align-items: flex-start;
    gap: 6px;
`;

const DeploySettings = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const ContextMenu = styled.div<{ $x: number; $y: number }>`
    position: fixed;
    left: ${({ $x }) => $x}px;
    top: ${({ $y }) => $y}px;
    background: ${({ theme }) => theme.card};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    padding: 4px;
    box-shadow: ${({ theme }) => theme.shadowLarge};
    z-index: 1000;
    min-width: 150px;
`;

const ContextMenuItem = styled.div`
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.surface};
    }
`;

const FileInput = styled.input`
    display: none;
`;

interface ConsoleMessage {
    id: string;
    type: "info" | "error" | "success";
    message: string;
    timestamp: Date;
}

enum DeployResultStatus {
    Completed = "completed",
    Submitted = "submitted",
    Errored = "errored",
    SystemError = "system_error",
    Pending = "pending",
}

type DeployResultData = {
    status: DeployResultStatus;
    message?: string;
    error?: string;
    blockHash?: string;
    cost?: string;
};

interface DeployProModeContextValue {
    items: IDEItem[];
    activeFileId: string;
    openFiles: string[];
    expandedFolders: Set<string>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    workspaceInputRef: React.RefObject<HTMLInputElement>;
    contextMenu: { x: number; y: number; item: IDEItem } | null;
    renamingId: string | null;
    newName: string;
    showPasswordModal: boolean;
    showDeployConfirmation: boolean;
    showExploreConfirmation: boolean;
    isDeploying: boolean;
    consoleMessages: ConsoleMessage[];
    monacoInitialized: boolean;
    darkMode: boolean;
    selectedAccount: RootState["wallet"]["selectedAccount"];
    activeFile: IDEFile | undefined;
    phloLimit: string;
    phloPrice: string;
    setActiveFileId: (id: string) => void;
    setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
    setContextMenu: (
        value: { x: number; y: number; item: IDEItem } | null,
    ) => void;
    setNewName: (value: string) => void;
    setRenamingId: (value: string | null) => void;
    setEditorInstance: (
        editor: monaco.editor.IStandaloneCodeEditor | null,
    ) => void;
    setShowPasswordModal: (value: boolean) => void;
    setShowDeployConfirmation: (value: boolean) => void;
    setShowExploreConfirmation: (value: boolean) => void;
    handleEditorChange: (value: string | undefined) => void;
    handleNewFile: (folderId?: string) => void;
    handleNewFolder: (parentId?: string) => void;
    handleCloseFile: (fileId: string) => void;
    handleDelete: (item: IDEItem) => void;
    handleRename: (item: IDEItem, newName: string) => void;
    handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportWorkspace: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeploy: () => void;
    handleExplore: () => void;
    handleConfirmDeploy: () => void;
    handleConfirmExplore: () => void;
    handlePasswordSubmit: (password: string) => void;
    clearConsole: () => void;
    toggleFolder: (folderId: string) => void;
}

const DeployProModeContext = createContext<DeployProModeContextValue | null>(
    null,
);

const useDeployProMode = (): DeployProModeContextValue => {
    const context = useContext(DeployProModeContext);
    if (!context) {
        throw new Error(
            "DeployProModeWidget compound components must be used within <DeployProModeWidget>",
        );
    }
    return context;
};

interface DeployProModeWidgetProps {
    phloLimit: string;
    phloPrice: string;
    children: React.ReactNode;
}

const DeployProModeWidgetRoot: React.FC<DeployProModeWidgetProps> = ({
    phloLimit,
    phloPrice,
    children,
}) => {
    const { selectedAccount, selectedNetwork } = useSelector(
        (state: RootState) => state.wallet,
    );
    const { darkMode } = useSelector((state: RootState) => state.theme);
    const { unlockedAccounts } = useSelector((state: RootState) => state.auth);
    const [, setEditorInstance] =
        useState<monaco.editor.IStandaloneCodeEditor | null>(null);

    // State to track if Monaco is initialized
    const [monacoInitialized, setMonacoInitialized] = useState(false);

    // Initialize Monaco editor with Rholang support
    useEffect(() => {
        // Monaco is now auto-initialized in newer versions
        registerRholangLanguage();
        setMonacoInitialized(true);
    }, []);

    // File management state
    const [items, setItems] = useState<IDEItem[]>([]);
    const [activeFileId, setActiveFileId] = useState<string>("");
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(["examples-folder", "contracts-folder"]),
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workspaceInputRef = useRef<HTMLInputElement>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        item: IDEItem;
    } | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    // Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Confirmation modal state
    const [showDeployConfirmation, setShowDeployConfirmation] = useState(false);
    const [showExploreConfirmation, setShowExploreConfirmation] =
        useState(false);

    const [isDeploying, setIsDeploying] = useState(false);

    // Console output
    const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>(
        [],
    );

    // Helper function to check if account is unlocked
    const isAccountUnlocked = (account: any): boolean => {
        const isUnlocked = unlockedAccounts.some(
            (unlockedAcc) => unlockedAcc.id === account?.id,
        );
        console.log("IDE page - isAccountUnlocked:", {
            selectedAccount: account,
            unlockedAccounts: unlockedAccounts,
            isUnlocked: isUnlocked,
        });
        return isUnlocked;
    };

    // Load files from storage on mount
    useEffect(() => {
        const loadedItems = IDEStorageService.loadFiles();
        setItems(loadedItems);

        // Load workspace state
        const workspaceState = IDEStorageService.loadWorkspaceState();
        if (workspaceState) {
            setActiveFileId(workspaceState.activeFileId || "");
            setOpenFiles(workspaceState.openFiles || []);
            setExpandedFolders(new Set(workspaceState.expandedFolders || []));
        } else {
            // Set default active file
            const defaultFile = loadedItems.find(
                (item) => item.id === "hello-rho",
            );
            if (defaultFile) {
                setActiveFileId(defaultFile.id);
                setOpenFiles([defaultFile.id]);
            }
        }
    }, []);

    // Save files to storage whenever they change
    useEffect(() => {
        if (items.length > 0) {
            IDEStorageService.saveFiles(items);
        }
    }, [items]);

    // Save workspace state
    useEffect(() => {
        IDEStorageService.saveWorkspaceState({
            activeFileId,
            openFiles,
            expandedFolders: Array.from(expandedFolders),
        });
    }, [activeFileId, openFiles, expandedFolders]);

    const activeFile = items.find(
        (f) => f.id === activeFileId && f.type === "file",
    ) as IDEFile | undefined;

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const addConsoleMessage = (
        type: ConsoleMessage["type"],
        message: string,
    ) => {
        setConsoleMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                type,
                message,
                timestamp: new Date(),
            },
        ]);
    };

    const handleEditorChange = (value: string | undefined) => {
        if (!value || !activeFile) return;

        setItems((prev) =>
            prev.map((item) =>
                item.id === activeFileId && item.type === "file"
                    ? {
                          ...item,
                          content: value,
                          modified: true,
                          updatedAt: new Date(),
                      }
                    : item,
            ),
        );
    };

    const handleNewFile = (folderId?: string) => {
        const now = new Date();
        const fileCount = items.filter((item) => item.type === "file").length;
        const newFile: IDEFile = {
            id: Date.now().toString(),
            name: `untitled-${fileCount + 1}.rho`,
            content: "// New Rholang contract\n",
            folderId,
            type: "file",
            modified: false,
            createdAt: now,
            updatedAt: now,
        };
        setItems((prev) => [...prev, newFile]);
        setOpenFiles((prev) => [...prev, newFile.id]);
        setActiveFileId(newFile.id);
    };

    const handleNewFolder = (parentId?: string) => {
        const now = new Date();
        const folderCount = items.filter(
            (item) => item.type === "folder",
        ).length;
        const newFolder: IDEFolder = {
            id: Date.now().toString(),
            name: `new-folder-${folderCount + 1}`,
            parentId,
            type: "folder",
            createdAt: now,
            updatedAt: now,
        };
        setItems((prev) => [...prev, newFolder]);
        setExpandedFolders(
            (prev) => new Set([...Array.from(prev), newFolder.id]),
        );
    };

    const handleCloseFile = (fileId: string) => {
        const newOpenFiles = openFiles.filter((id) => id !== fileId);
        setOpenFiles(newOpenFiles);

        if (activeFileId === fileId && newOpenFiles.length > 0) {
            setActiveFileId(newOpenFiles[newOpenFiles.length - 1]);
        }
    };

    const handleDelete = (item: IDEItem) => {
        if (item.type === "folder") {
            // Check if folder has children
            const hasChildren = items.some(
                (i) =>
                    (i.type === "file" &&
                        (i as IDEFile).folderId === item.id) ||
                    (i.type === "folder" &&
                        (i as IDEFolder).parentId === item.id),
            );

            if (hasChildren) {
                addConsoleMessage(
                    "error",
                    "Cannot delete folder with contents",
                );
                return;
            }
        }

        setItems((prev) => prev.filter((i) => i.id !== item.id));

        if (item.type === "file") {
            setOpenFiles((prev) => prev.filter((id) => id !== item.id));
            if (activeFileId === item.id) {
                const newActiveId =
                    openFiles.find((id) => id !== item.id) || "";
                setActiveFileId(newActiveId);
            }
        }
    };

    const handleRename = (item: IDEItem, newName: string) => {
        setItems((prev) =>
            prev.map((i) =>
                i.id === item.id
                    ? { ...i, name: newName, updatedAt: new Date() }
                    : i,
            ),
        );
        setRenamingId(null);
        setNewName("");
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const ideFile = await IDEStorageService.importFile(file);
            setItems((prev) => [...prev, ideFile]);
            setOpenFiles((prev) => [...prev, ideFile.id]);
            setActiveFileId(ideFile.id);
            addConsoleMessage("success", `Imported ${ideFile.name}`);
        } catch (error) {
            addConsoleMessage("error", "Failed to import file");
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImportWorkspace = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const importedItems = await IDEStorageService.importWorkspace(file);
            setItems(importedItems);
            addConsoleMessage("success", "Workspace imported successfully");
        } catch (error) {
            addConsoleMessage("error", "Failed to import workspace");
        }

        // Reset input
        if (workspaceInputRef.current) {
            workspaceInputRef.current.value = "";
        }
    };

    const handleDeploy = async () => {
        if (!selectedAccount || !activeFile) {
            addConsoleMessage(
                "error",
                "Please select an account and file to deploy",
            );
            return;
        }

        // Check if account is unlocked
        if (!isAccountUnlocked(selectedAccount)) {
            // Show password modal
            setShowPasswordModal(true);
            return;
        }

        // Show confirmation modal
        setShowDeployConfirmation(true);
    };

    const logDeployResult = (result: DeployResultData) => {
        if (result.status === DeployResultStatus.Completed) {
            addConsoleMessage("success", `[SUCCESS] ${result.message}`);
            if (result.blockHash)
                addConsoleMessage("info", `Block Hash: ${result.blockHash}`);
            if (result.cost)
                addConsoleMessage("info", `Gas Cost: ${result.cost}`);
            return;
        }

        if (result.status === DeployResultStatus.Submitted) {
            addConsoleMessage("info", `[INFO] ${result.message}`);
            return;
        }

        if (result.status === DeployResultStatus.Errored) {
            addConsoleMessage(
                "error",
                `[ERROR] Deploy execution failed: ${result.error}`,
            );
            return;
        }

        if (result.status === DeployResultStatus.SystemError) {
            addConsoleMessage("error", `[ERROR] System error: ${result.error}`);
            return;
        }

        addConsoleMessage(
            "info",
            result.message ??
                "[PENDING] Deploy submitted successfully. It may still be processing or pending block inclusion.",
        );
    };

    const waitForDeployAndLog = async (
        rchain: RChainService,
        deployId: string,
    ) => {
        try {
            addConsoleMessage(
                "info",
                "Waiting for deploy to be included in block...",
            );
            const result = await rchain.waitForDeployResult(deployId);
            logDeployResult(result);
        } catch {
            addConsoleMessage(
                "info",
                "[PENDING] Deploy submitted successfully. It may still be processing or pending block inclusion.",
            );
        }
    };

    const handleDeployWithPassword = async (password: string) => {
        if (!selectedAccount || !activeFile) return;
        if (!SecureStorage.hasSessionToken()) {
            addConsoleMessage("error", "Session expired. Please login again.");
            return;
        }

        setIsDeploying(true);
        setShowPasswordModal(false); // Close password modal immediately
        addConsoleMessage("info", `Deploying ${activeFile.name}...`);

        try {
            if (!selectedNetwork.url || !selectedNetwork.url.trim()) {
                throw new Error(
                    `Network "${selectedNetwork.name}" has no validator URL configured`,
                );
            }

            const rchain = new RChainService(
                selectedNetwork.url.trim(),
                selectedNetwork.readOnlyUrl,
                selectedNetwork.adminUrl,
                selectedNetwork.shardId,
            );
            let privateKey = selectedAccount.privateKey;

            if (!privateKey && password) {
                const userId = SecureStorage.getCurrentUserId();
                const unlockedAccount = await SecureStorage.unlockAccount(
                    selectedAccount.id,
                    password,
                    userId ?? undefined,
                );
                privateKey = unlockedAccount?.privateKey;
            }

            if (!privateKey) {
                throw new Error("Failed to access private key");
            }

            let expectedBalanceAfterConfirmation: string | undefined;
            try {
                const atomicBalanceBefore = await rchain.getBalance(
                    selectedAccount.revAddress,
                    true,
                );
                const chainBalanceBefore =
                    Number(atomicBalanceBefore) / 100000000;
                const gasFee = getGasFeeAsNumber();
                const expected = Math.max(0, chainBalanceBefore - gasFee);
                expectedBalanceAfterConfirmation = expected.toFixed(8);
            } catch (error) {
                console.warn(
                    "[IDE] Failed to fetch balance before deploy for pending metadata:",
                    error,
                );
            }

            const deployId = await rchain.sendDeploy(
                activeFile.content,
                privateKey,
                parseInt(phloLimit),
            );

            addConsoleMessage(
                "success",
                `Deploy submitted successfully! Deploy ID: ${deployId}`,
            );

            savePendingDeploy(
                deployId,
                selectedAccount.id,
                selectedAccount.revAddress,
                expectedBalanceAfterConfirmation,
            );

            await waitForDeployAndLog(rchain, deployId);
        } catch (error: any) {
            addConsoleMessage("error", `Deploy failed: ${error.message}`);
        } finally {
            setIsDeploying(false);
        }
    };

    const handleConfirmDeploy = async () => {
        if (!selectedAccount || !activeFile) return;
        if (!SecureStorage.hasSessionToken()) {
            addConsoleMessage("error", "Session expired. Please login again.");
            return;
        }

        setShowDeployConfirmation(false);
        setIsDeploying(true);
        addConsoleMessage("info", `Deploying ${activeFile.name}...`);

        try {
            if (!selectedNetwork.url || !selectedNetwork.url.trim()) {
                throw new Error(
                    `Network "${selectedNetwork.name}" has no validator URL configured`,
                );
            }

            const rchain = new RChainService(
                selectedNetwork.url.trim(),
                selectedNetwork.readOnlyUrl,
                selectedNetwork.adminUrl,
                selectedNetwork.shardId,
            );

            // Find the private key from unlocked accounts
            const unlockedAccount = unlockedAccounts.find(
                (acc) => acc.id === selectedAccount.id,
            );
            const privateKey = unlockedAccount?.privateKey;

            if (!privateKey) {
                throw new Error(
                    "Account is locked. Please unlock your account first.",
                );
            }

            let expectedBalanceAfterConfirmation: string | undefined;
            try {
                const atomicBalanceBefore = await rchain.getBalance(
                    selectedAccount.revAddress,
                    true,
                );
                const chainBalanceBefore =
                    Number(atomicBalanceBefore) / 100000000;
                const gasFee = getGasFeeAsNumber();
                const expected = Math.max(0, chainBalanceBefore - gasFee);
                expectedBalanceAfterConfirmation = expected.toFixed(8);
            } catch (error) {
                console.warn(
                    "[IDE] Failed to fetch balance before deploy for pending metadata:",
                    error,
                );
            }

            const deployId = await rchain.sendDeploy(
                activeFile.content,
                privateKey,
                parseInt(phloLimit),
            );

            addConsoleMessage(
                "success",
                `Deploy submitted successfully! Deploy ID: ${deployId}`,
            );

            savePendingDeploy(
                deployId,
                selectedAccount.id,
                selectedAccount.revAddress,
                expectedBalanceAfterConfirmation,
            );

            await waitForDeployAndLog(rchain, deployId);
        } catch (error: any) {
            addConsoleMessage("error", `Deploy failed: ${error.message}`);
        } finally {
            setIsDeploying(false);
        }
    };

    const handleExplore = async () => {
        if (!activeFile) return;
        setShowExploreConfirmation(true);
    };

    const handleConfirmExplore = async () => {
        if (!activeFile) return;

        setShowExploreConfirmation(false);
        setIsDeploying(true);
        addConsoleMessage("info", `Exploring ${activeFile.name}...`);

        try {
            if (!selectedNetwork.url || !selectedNetwork.url.trim()) {
                throw new Error(
                    `Network "${selectedNetwork.name}" has no validator URL configured`,
                );
            }

            const rchain = new RChainService(
                selectedNetwork.url.trim(),
                selectedNetwork.readOnlyUrl,
                selectedNetwork.adminUrl,
                selectedNetwork.shardId,
            );
            const result = await rchain.exploreDeployData(activeFile.content);

            addConsoleMessage(
                "success",
                `Explore result: ${JSON.stringify(result, null, 2)}`,
            );
        } catch (error: any) {
            addConsoleMessage("error", `Explore failed: ${error.message}`);
        } finally {
            setIsDeploying(false);
        }
    };

    const clearConsole = () => {
        setConsoleMessages([]);
    };

    const handlePasswordSubmit = (password: string) => {
        handleDeployWithPassword(password);
    };

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const value: DeployProModeContextValue = {
        items,
        activeFileId,
        openFiles,
        expandedFolders,
        fileInputRef,
        workspaceInputRef,
        contextMenu,
        renamingId,
        newName,
        showPasswordModal,
        showDeployConfirmation,
        showExploreConfirmation,
        isDeploying,
        consoleMessages,
        monacoInitialized,
        darkMode,
        selectedAccount,
        activeFile,
        phloLimit,
        phloPrice,
        setActiveFileId,
        setOpenFiles,
        setContextMenu,
        setNewName,
        setRenamingId,
        setEditorInstance,
        setShowPasswordModal,
        setShowDeployConfirmation,
        setShowExploreConfirmation,
        handleEditorChange,
        handleNewFile,
        handleNewFolder,
        handleCloseFile,
        handleDelete,
        handleRename,
        handleImportFile,
        handleImportWorkspace,
        handleDeploy,
        handleExplore,
        handleConfirmDeploy,
        handleConfirmExplore,
        handlePasswordSubmit,
        clearConsole,
        toggleFolder,
    };

    return (
        <DeployProModeContext.Provider value={value}>
            {children}
        </DeployProModeContext.Provider>
    );
};

const defaultButtonStyle: CSSProperties = {
    height: "44px",
    whiteSpace: "nowrap",
};

const DeployProModeActions: React.FC = () => {
    const { items, workspaceInputRef } = useDeployProMode();
    const { isTablet } = useScreen();

    const adaptiveButtonLabelStyle: CSSProperties = useMemo(
        () => (!isTablet ? {} : { fontSize: "0.875rem" }),
        [isTablet],
    );

    return (
        <ToolbarActions>
            <Button
                id="ide-import-workspace-button"
                style={defaultButtonStyle}
                fullWidth={isTablet}
                onClick={() => workspaceInputRef.current?.click()}
            >
                <h3 style={adaptiveButtonLabelStyle}>Import Workspace</h3>
            </Button>
            <Button
                id="ide-export-workspace-button"
                style={defaultButtonStyle}
                fullWidth={isTablet}
                onClick={() => IDEStorageService.exportWorkspace(items)}
            >
                <h3 style={adaptiveButtonLabelStyle}>Export Workspace</h3>
            </Button>
        </ToolbarActions>
    );
};

const DeployProModeBoard: React.FC = () => {
    const {
        items,
        activeFileId,
        openFiles,
        expandedFolders,
        fileInputRef,
        workspaceInputRef,
        contextMenu,
        renamingId,
        newName,
        showPasswordModal,
        showDeployConfirmation,
        showExploreConfirmation,
        isDeploying,
        consoleMessages,
        monacoInitialized,
        darkMode,
        selectedAccount,
        activeFile,
        phloLimit,
        phloPrice,
        setActiveFileId,
        setOpenFiles,
        setContextMenu,
        setNewName,
        setRenamingId,
        setEditorInstance,
        setShowPasswordModal,
        setShowDeployConfirmation,
        setShowExploreConfirmation,
        handleEditorChange,
        handleNewFile,
        handleNewFolder,
        handleCloseFile,
        handleDelete,
        handleRename,
        handleImportFile,
        handleImportWorkspace,
        handleDeploy,
        handleExplore,
        handleConfirmDeploy,
        handleConfirmExplore,
        handlePasswordSubmit,
        clearConsole,
        toggleFolder,
    } = useDeployProMode();

    const { isLaptop } = useScreen();

    const renderFileTree = (
        parentId?: string,
        depth = 0,
    ): React.ReactNode[] => {
        const folders = items.filter(
            (item) =>
                item.type === "folder" &&
                (parentId
                    ? (item as IDEFolder).parentId === parentId
                    : !(item as IDEFolder).parentId),
        );

        const files = items.filter(
            (item) =>
                item.type === "file" &&
                (parentId
                    ? (item as IDEFile).folderId === parentId
                    : !(item as IDEFile).folderId),
        );

        return [
            ...folders.map((folder) => (
                <React.Fragment key={folder.id}>
                    <TreeItem
                        $depth={depth}
                        onClick={() => toggleFolder(folder.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                item: folder,
                            });
                        }}
                    >
                        <TreeIcon>
                            {expandedFolders.has(folder.id) ? (
                                <ChevronDownIcon size={14} />
                            ) : (
                                <ChevronRightIcon size={14} />
                            )}
                            {expandedFolders.has(folder.id) ? (
                                <FolderOpenIcon size={16} />
                            ) : (
                                <FolderIcon size={16} />
                            )}
                        </TreeIcon>
                        {renamingId === folder.id ? (
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                        handleRename(folder, newName);
                                    if (e.key === "Escape") {
                                        setRenamingId(null);
                                        setNewName("");
                                    }
                                }}
                                onBlur={() => handleRename(folder, newName)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        ) : (
                            folder.name
                        )}
                    </TreeItem>
                    {expandedFolders.has(folder.id) &&
                        renderFileTree(folder.id, depth + 1)}
                </React.Fragment>
            )),
            ...files.map((file) => (
                <TreeItem
                    key={file.id}
                    $depth={depth}
                    $active={file.id === activeFileId}
                    onClick={() => {
                        setActiveFileId(file.id);
                        if (!openFiles.includes(file.id)) {
                            setOpenFiles((prev) => [...prev, file.id]);
                        }
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            item: file,
                        });
                    }}
                >
                    <TreeIcon>
                        <FileIcon size={16} />
                    </TreeIcon>
                    {renamingId === file.id ? (
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter")
                                    handleRename(file, newName);
                                if (e.key === "Escape") {
                                    setRenamingId(null);
                                    setNewName("");
                                }
                            }}
                            onBlur={() => handleRename(file, newName)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    ) : (
                        file.name
                    )}
                </TreeItem>
            )),
        ];
    };

    return (
        <IDEContainer>
            <FileInput
                ref={fileInputRef}
                type="file"
                accept=".rho"
                onChange={handleImportFile}
            />
            <FileInput
                ref={workspaceInputRef}
                type="file"
                accept=".json"
                onChange={handleImportWorkspace}
            />

            <MainContent>
                <FileExplorer>
                    <ExplorerHeader>Files</ExplorerHeader>
                    <FileExplorerContent className="file-explorer-content">
                        <FileList>
                            <FileTree>{renderFileTree()}</FileTree>
                        </FileList>
                        <ToolbarActions
                            style={{ justifyContent: "end", padding: "7px" }}
                        >
                            <Button
                                size="small"
                                variant="icon-button"
                                onClick={() => handleNewFile()}
                                title="New File"
                            >
                                <PlusIcon size={14} />
                            </Button>
                            <Button
                                size="small"
                                variant="icon-button"
                                onClick={() => handleNewFolder()}
                                title="New Folder"
                            >
                                <FolderIcon size={14} />
                            </Button>
                            <Button
                                size="small"
                                variant="icon-button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Import File"
                            >
                                <DownloadIcon size={14} />
                            </Button>
                        </ToolbarActions>
                    </FileExplorerContent>
                </FileExplorer>

                <EditorContainer>
                    <EditorHeader>
                        <h4 className="light">Rholang Code</h4>
                        {openFiles.map((fileId) => {
                            const file = items.find(
                                (f) => f.id === fileId && f.type === "file",
                            ) as IDEFile;
                            if (!file) return null;
                            return (
                                <TabItem
                                    key={fileId}
                                    $active={fileId === activeFileId}
                                >
                                    <span
                                        className="text-3"
                                        onClick={() => setActiveFileId(fileId)}
                                    >
                                        {file.name}
                                        {file.modified ? "*" : ""}
                                    </span>
                                    <CloseButton
                                        onClick={() => handleCloseFile(fileId)}
                                    >
                                        ×
                                    </CloseButton>
                                </TabItem>
                            );
                        })}
                    </EditorHeader>
                    <EditorWrapper $darkMode={darkMode}>
                        {activeFile && monacoInitialized && (
                            <Editor
                                height="100%"
                                language={RHOLANG_LANGUAGE_ID}
                                value={activeFile.content}
                                onChange={handleEditorChange}
                                theme={darkMode ? "vs-dark" : "light"}
                                onMount={(editor, _monaco) => {
                                    setEditorInstance(editor);
                                }}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: "on",
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                }}
                            />
                        )}
                    </EditorWrapper>
                </EditorContainer>
            </MainContent>

            <Toolbar>
                <DeploySettings>
                    <Button
                        id="ide-deploy-button"
                        size="small"
                        onClick={handleDeploy}
                        loading={isDeploying}
                    >
                        <h3>Deploy</h3>
                    </Button>
                    <Button
                        id="ide-explore-button"
                        size="small"
                        variant="secondary"
                        onClick={handleExplore}
                        loading={isDeploying}
                    >
                        <h3>Explore</h3>
                    </Button>
                    <Button
                        title="Clear console output"
                        variant="ghost"
                        size="small"
                        onClick={clearConsole}
                        dangerHover
                        style={{
                            height: "30px",
                        }}
                    >
                        {!isLaptop && (
                            <h3
                                style={{ fontSize: "0.75rem" }}
                                className="text-danger"
                            >
                                Clear
                            </h3>
                        )}
                        <DeleteIcon />
                    </Button>
                </DeploySettings>
            </Toolbar>

            <ConsolePanel>
                <OutputHeader>
                    <h4>Console</h4>
                </OutputHeader>
                <OutputContent>
                    {consoleMessages.map((msg) => (
                        <ConsoleEntry key={msg.id} $type={msg.type}>
                            {msg.type === "success" && (
                                <SuccessIcon size={14} />
                            )}
                            {msg.type === "error" && <ErrorIcon size={14} />}
                            {msg.type === "info" && <PendingIcon size={14} />}
                            <span>
                                [{msg.timestamp.toLocaleTimeString()}]{" "}
                                {msg.message}
                            </span>
                        </ConsoleEntry>
                    ))}
                    {consoleMessages.length === 0 && (
                        <ConsoleEntry>
                            <h5>Console output will appear here...</h5>
                        </ConsoleEntry>
                    )}
                </OutputContent>
            </ConsolePanel>

            {contextMenu && (
                <ContextMenu
                    $x={contextMenu.x}
                    $y={contextMenu.y}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item.type === "folder" && (
                        <>
                            <ContextMenuItem
                                onClick={() => {
                                    handleNewFile(
                                        (contextMenu.item as IDEFolder).id,
                                    );
                                    setContextMenu(null);
                                }}
                            >
                                New File
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => {
                                    handleNewFolder(
                                        (contextMenu.item as IDEFolder).id,
                                    );
                                    setContextMenu(null);
                                }}
                            >
                                New Folder
                            </ContextMenuItem>
                        </>
                    )}
                    {contextMenu.item.type === "file" && (
                        <ContextMenuItem
                            onClick={() => {
                                IDEStorageService.exportFile(
                                    contextMenu.item as IDEFile,
                                );
                                setContextMenu(null);
                            }}
                        >
                            Export File
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        onClick={() => {
                            setRenamingId(contextMenu.item.id);
                            setNewName(contextMenu.item.name);
                            setContextMenu(null);
                        }}
                    >
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() => {
                            handleDelete(contextMenu.item);
                            setContextMenu(null);
                        }}
                    >
                        Delete
                    </ContextMenuItem>
                </ContextMenu>
            )}

            {/* Deploy Confirmation Modal */}
            <DeploymentConfirmationModal
                isOpen={showDeployConfirmation}
                onClose={() => setShowDeployConfirmation(false)}
                onConfirm={handleConfirmDeploy}
                rholangCode={activeFile?.content || ""}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={selectedAccount?.name || ""}
                accountAddress={selectedAccount?.revAddress || ""}
                fileName={activeFile?.name}
                loading={isDeploying}
            />

            {/* Explore Confirmation Modal */}
            <DeploymentConfirmationModal
                isOpen={showExploreConfirmation}
                onClose={() => setShowExploreConfirmation(false)}
                onConfirm={handleConfirmExplore}
                rholangCode={activeFile?.content || ""}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={selectedAccount?.name || ""}
                accountAddress={selectedAccount?.revAddress || ""}
                fileName={activeFile?.name}
                isExplore={true}
                loading={isDeploying}
            />

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={handlePasswordSubmit}
                title="Enter Password to Deploy"
                description="Your private key is encrypted. Please enter your password to deploy the contract."
            />
        </IDEContainer>
    );
};

export const DeployProModeWidget = Object.assign(DeployProModeWidgetRoot, {
    Actions: DeployProModeActions,
    Board: DeployProModeBoard,
});
