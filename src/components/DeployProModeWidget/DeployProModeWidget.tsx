import React, {
    createContext,
    CSSProperties,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import { RootState } from "store";
import { Button, DeploymentConfirmationModal, PasswordModal } from "components";
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
import {
    DeployEventTypes,
    IUseDeployContractResponse,
    TDeployEvent,
    useDeployContract,
    useScreen,
} from "hooks/";
import { stringifyWithBigInt } from "utils/helpers";

enum ConsoleMessageMods {
    INFO = "info",
    ERROR = "error",
    SUCCESS = "success",
    WARNING = "warning",
}

const IDEContainer = styled.div`
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
        height: auto;
    }
`;

const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.xl};
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.card};
    margin-bottom: 24px;

    @media (max-width: 768px) {
        margin-bottom: 36px;
    }
`;

const ToolbarActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.xl};
    align-items: center;
    width: auto;

    @media (max-width: ${({ theme }) => theme.breakpoints.laptop}) {
        width: 100%;
        margin-bottom: 1rem;
        gap: 16px;
    }
`;

const MainContent = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    width: 100%;
    gap: ${({ theme }) => theme.spacing["3xl"]};
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
        margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
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
        $active ? theme.primarySubtle : "transparent"};
    color: ${({ $active, theme }) =>
        $active ? theme.actionText : theme.text.primary};
    border-left: 3px solid
        ${({ $active, theme }) => ($active ? theme.actionText : "transparent")};
    transition: all 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.hoverSurface};
    }

    &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 2px ${({ theme }) => theme.focusRing};
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
    min-width: 0;
    overflow: hidden;

    @media (max-width: 768px) {
        height: fit-content;
    }
`;

const EditorHeader = styled.div`
    background: ${({ theme }) => theme.surface};
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

    button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px ${({ theme }) => theme.focusRing};
    }
`;

const TabSelect = styled.button`
    border: 0;
    padding: ${({ theme }) => theme.spacing.xs};
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.text.tertiary};
    cursor: pointer;
    padding: 0 4px;
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
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const OutputContent = styled.div`
    flex: 1;
    overflow-y: auto;
    font-size: 13px;
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    min-height: 150px;
`;

const ConsoleEntry = styled.div<{ $type?: ConsoleMessageMods }>`
    margin-bottom: 4px;
    color: ${({ theme, $type }) => {
        switch ($type) {
            case ConsoleMessageMods.ERROR:
                return theme.danger;
            case ConsoleMessageMods.SUCCESS:
                return theme.success;
            case ConsoleMessageMods.WARNING:
                return theme.warning;
            default:
                return theme.text.secondary;
        }
    }};
    display: flex;
    align-items: flex-start;
    gap: 6px;
`;

const DeploySettings = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        flex-direction: column;
        align-items: stretch;
        width: 100%;

        > button {
            width: 100%;
            height: ${({ theme }) => theme.sizes.control.field};
            min-height: ${({ theme }) => theme.sizes.control.field};
        }
    }
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
    z-index: ${({ theme }) => theme.zIndices.dropdown};
    min-width: 150px;
`;

const ContextMenuItem = styled.button`
    display: block;
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    border-radius: 4px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    transition: all 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.surface};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.focusRing};
    }
`;

const DeployStatusPanel = styled.div<{ $tone: "info" | "success" | "warning" }>`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.spacing.xl};
    padding: ${({ theme }) => theme.spacing.xl};
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    border: 1px solid ${({ theme, $tone }) =>
        $tone === "warning" ? theme.warning : $tone === "success" ? theme.success : theme.info};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.card};
    color: ${({ theme }) => theme.text.primary};

    code {
        display: block;
        margin-top: ${({ theme }) => theme.spacing.md};
        overflow-wrap: anywhere;
    }
`;

const FileInput = styled.input`
    display: none;
`;

interface IConsoleMessage {
    id: string;
    type: ConsoleMessageMods;
    message: string;
    timestamp: Date;
}

interface IContextMenuState {
    x: number;
    y: number;
    item: IDEItem;
}

interface IDeployProModeContextValue extends IUseDeployContractResponse {
    isActive: boolean;
    items: IDEItem[];
    activeFileId: string;
    openFiles: string[];
    expandedFolders: Set<string>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    workspaceInputRef: React.RefObject<HTMLInputElement>;
    contextMenu: IContextMenuState | null;
    renamingId: string | null;
    newName: string;
    consoleMessages: IConsoleMessage[];
    monacoInitialized: boolean;
    darkMode: boolean;
    activeFile: IDEFile | undefined;
    deployableFile: IDEFile | undefined;
    phloLimit: string;
    phloPrice: string;
    setActiveFileId: (id: string) => void;
    setOpenFiles: React.Dispatch<React.SetStateAction<string[]>>;
    setContextMenu: (value: IContextMenuState | null) => void;
    setNewName: (value: string) => void;
    setRenamingId: (value: string | null) => void;
    handleEditorChange: (value: string | undefined) => void;
    handleNewFile: (folderId?: string) => void;
    handleNewFolder: (parentId?: string) => void;
    handleCloseFile: (fileId: string) => void;
    handleDelete: (item: IDEItem) => void;
    handleRename: (item: IDEItem, name: string) => void;
    handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportWorkspace: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeployClick: () => void;
    handleExploreClick: () => void;
    handleLoadExample: () => void;
    clearConsole: () => void;
    toggleFolder: (folderId: string) => void;
}

const DeployProModeContext = createContext<IDeployProModeContextValue | null>(
    null,
);

const useDeployProMode = (): IDeployProModeContextValue => {
    const context = useContext(DeployProModeContext);

    if (!context) {
        throw new Error(
            "DeployProModeWidget compound components must be used within <DeployProModeWidget>",
        );
    }

    return context;
};

interface IDeployProModeWidgetProps {
    phloLimit: string;
    phloPrice: string;
    isActive?: boolean;
    children: React.ReactNode;
}

const DEFAULT_EXPANDED_FOLDER_IDS = ["examples-folder", "contracts-folder"];
const DEFAULT_FILE_ID = "hello-rho";

interface IInitialWorkspace {
    items: IDEItem[];
    activeFileId: string;
    openFiles: string[];
    expandedFolders: Set<string>;
}

const loadInitialWorkspace = (): IInitialWorkspace => {
    const items = IDEStorageService.loadFiles();
    const workspaceState = IDEStorageService.loadWorkspaceState();

    if (workspaceState) {
        return {
            items,
            activeFileId: workspaceState.activeFileId || "",
            openFiles: workspaceState.openFiles || [],
            expandedFolders: new Set<string>(
                workspaceState.expandedFolders || [],
            ),
        };
    }

    const defaultFile = items.find((item) => item.id === DEFAULT_FILE_ID);

    return {
        items,
        activeFileId: defaultFile?.id ?? "",
        openFiles: defaultFile ? [defaultFile.id] : [],
        expandedFolders: new Set(DEFAULT_EXPANDED_FOLDER_IDS),
    };
};

const DeployProModeWidgetRoot: React.FC<IDeployProModeWidgetProps> = ({
    phloLimit,
    phloPrice,
    isActive = true,
    children,
}) => {
    const darkMode = useSelector((state: RootState) => state.theme.darkMode);

    const [initialWorkspace] = useState<IInitialWorkspace>(
        loadInitialWorkspace,
    );

    const [monacoInitialized, setMonacoInitialized] = useState(false);
    const [items, setItems] = useState<IDEItem[]>(initialWorkspace.items);
    const [activeFileId, setActiveFileId] = useState<string>(
        initialWorkspace.activeFileId,
    );
    const [openFiles, setOpenFiles] = useState<string[]>(
        initialWorkspace.openFiles,
    );
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        initialWorkspace.expandedFolders,
    );
    const [contextMenu, setContextMenu] = useState<IContextMenuState | null>(
        null,
    );
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [consoleMessages, setConsoleMessages] = useState<IConsoleMessage[]>(
        [],
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const workspaceInputRef = useRef<HTMLInputElement>(null);
    const consoleMessageIdRef = useRef(0);
    const itemIdCounterRef = useRef(0);

    const createItemId = (prefix: string): string => {
        const existingIds = new Set(items.map((item) => item.id));
        let id: string;
        do {
            itemIdCounterRef.current += 1;
            id = `${prefix}-${Date.now()}-${itemIdCounterRef.current}`;
        } while (existingIds.has(id));
        return id;
    };

    useLayoutEffect(() => {
        if (!isActive) setContextMenu(null);
    }, [isActive]);

    useEffect(() => {
        registerRholangLanguage();
        setMonacoInitialized(true);
    }, []);

    useEffect(() => {
        IDEStorageService.saveFiles(items);
    }, [items]);

    useEffect(() => {
        IDEStorageService.saveWorkspaceState({
            activeFileId,
            openFiles,
            expandedFolders: Array.from(expandedFolders),
        });
    }, [activeFileId, openFiles, expandedFolders]);

    const activeFile = items.find(
        (item) => item.id === activeFileId && item.type === "file",
    ) as IDEFile | undefined;

    const deployableFile: IDEFile | undefined = activeFile?.content.trim()
        ? activeFile
        : undefined;

    const addConsoleMessage = (
        type: ConsoleMessageMods,
        message: string,
    ): void => {
        consoleMessageIdRef.current += 1;
        const id = consoleMessageIdRef.current.toString();

        setConsoleMessages((prev) => [
            ...prev,
            {
                id,
                type,
                message,
                timestamp: new Date(),
            },
        ]);
    };

    const handleDeployEvent = (event: TDeployEvent): void => {
        switch (event.type) {
            case DeployEventTypes.DEPLOY_STARTED:
                addConsoleMessage(
                    ConsoleMessageMods.INFO,
                    `Deploying ${event.fileName ?? "contract"}...`,
                );

                return;
            case DeployEventTypes.DEPLOY_SUBMITTED:
                addConsoleMessage(
                    ConsoleMessageMods.INFO,
                    `Deploy sent! Deploy ID: ${event.deployId}`,
                );
                addConsoleMessage(
                    ConsoleMessageMods.INFO,
                    "Waiting for deploy to be included in block...",
                );

                return;
            case DeployEventTypes.DEPLOY_STATUS:
                addConsoleMessage(
                    ConsoleMessageMods.INFO,
                    `Deploy status: ${event.status}`,
                );

                return;
            case DeployEventTypes.DEPLOY_CONFIRMED:
                addConsoleMessage(
                    ConsoleMessageMods.SUCCESS,
                    "Deploy finalized",
                );

                return;
            case DeployEventTypes.DEPLOY_FAILED:
                addConsoleMessage(
                    ConsoleMessageMods.ERROR,
                    `Deploy failed: ${event.message}`,
                );

                return;
            case DeployEventTypes.DEPLOY_UNRESOLVED:
                addConsoleMessage(
                    ConsoleMessageMods.WARNING,
                    `Deploy status is unknown: ${event.message}. It may still be finalized, check the transaction history later.`,
                );

                return;
            case DeployEventTypes.EXPLORE_STARTED:
                addConsoleMessage(
                    ConsoleMessageMods.INFO,
                    `Exploring ${event.fileName ?? "contract"}...`,
                );

                return;
            case DeployEventTypes.EXPLORE_COMPLETED:
                addConsoleMessage(
                    ConsoleMessageMods.SUCCESS,
                    `Explore result: ${stringifyWithBigInt(event.result)}`,
                );

                return;
            case DeployEventTypes.EXPLORE_FAILED:
                addConsoleMessage(
                    ConsoleMessageMods.ERROR,
                    `Explore failed: ${event.message}`,
                );
        }
    };

    const deployContractState = useDeployContract({
        phloLimit,
        phloPrice,
        onEvent: handleDeployEvent,
    });

    const handleEditorChange = (value: string | undefined): void => {
        if (value === undefined) {
            return;
        }

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

    const handleNewFile = (folderId?: string): void => {
        const now = new Date();
        const fileCount = items.filter((item) => item.type === "file").length;
        const newFile: IDEFile = {
            id: createItemId("file"),
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

    const handleLoadExample = (): void => {
        const defaultExample = IDEStorageService.getDefaultFiles().find(
            (item): item is IDEFile => item.type === "file" && item.id === DEFAULT_FILE_ID,
        );
        if (!defaultExample) return;

        const existingExample = items.find(
            (item): item is IDEFile => item.type === "file" && item.id === DEFAULT_FILE_ID,
        );
        if (existingExample && !existingExample.modified && existingExample.content === defaultExample.content) {
            setActiveFileId(existingExample.id);
            setOpenFiles((prev) => prev.includes(existingExample.id) ? prev : [...prev, existingExample.id]);
            setExpandedFolders((prev) => new Set([...Array.from(prev), DEFAULT_EXPANDED_FOLDER_IDS[0]]));
            return;
        }

        const now = new Date();
        const newFile: IDEFile = {
            ...defaultExample,
            id: createItemId("example"),
            name: `hello-example-${items.filter((item) => item.type === "file" && item.name.startsWith("hello-example-")).length + 1}.rho`,
            folderId: undefined,
            createdAt: now,
            updatedAt: now,
        };
        setItems((prev) => [...prev, newFile]);
        setOpenFiles((prev) => [...prev, newFile.id]);
        setActiveFileId(newFile.id);
    };

    const handleNewFolder = (parentId?: string): void => {
        const now = new Date();
        const folderCount = items.filter(
            (item) => item.type === "folder",
        ).length;
        const newFolder: IDEFolder = {
            id: createItemId("folder"),
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

    const handleCloseFile = (fileId: string): void => {
        const nextOpenFiles = openFiles.filter((id) => id !== fileId);

        setOpenFiles(nextOpenFiles);

        if (activeFileId !== fileId) {
            return;
        }

        const nextActiveFileId: string = nextOpenFiles.length > 0
                ? nextOpenFiles[nextOpenFiles.length - 1]
                : "";

        setActiveFileId(
            nextActiveFileId
        );
    };

    const handleDelete = (item: IDEItem): void => {
        if (item.type === "folder") {
            const hasChildren = items.some(
                (child) =>
                    (child.type === "file" &&
                        (child as IDEFile).folderId === item.id) ||
                    (child.type === "folder" &&
                        (child as IDEFolder).parentId === item.id),
            );

            if (hasChildren) {
                addConsoleMessage(
                    ConsoleMessageMods.ERROR,
                    "Cannot delete folder with contents",
                );

                return;
            }
        }

        setItems((prev) => prev.filter((entry) => entry.id !== item.id));

        if (item.type !== "file") {
            return;
        }

        setOpenFiles((prev) => prev.filter((id) => id !== item.id));

        if (activeFileId === item.id) {
            setActiveFileId(openFiles.find((id) => id !== item.id) || "");
        }
    };

    const handleRename = (item: IDEItem, name: string): void => {
        if (!name.trim()) {
            setRenamingId(null);
            setNewName("");
            return;
        }
        setItems((prev) =>
            prev.map((entry) =>
                entry.id === item.id
                    ? { ...entry, name, updatedAt: new Date() }
                    : entry,
            ),
        );
        setRenamingId(null);
        setNewName("");
    };

    const handleImportFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const ideFile = await IDEStorageService.importFile(file);

            setItems((prev) => [...prev, ideFile]);
            setOpenFiles((prev) => [...prev, ideFile.id]);
            setActiveFileId(ideFile.id);
            addConsoleMessage(
                ConsoleMessageMods.SUCCESS,
                `Imported ${ideFile.name}`,
            );
        } catch {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Failed to import file",
            );
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImportWorkspace = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const importedItems = await IDEStorageService.importWorkspace(file);

            setItems(importedItems);
            const firstFile = importedItems.find((item): item is IDEFile => item.type === "file");
            setActiveFileId(firstFile?.id ?? "");
            setOpenFiles(firstFile ? [firstFile.id] : []);
            setExpandedFolders(new Set(importedItems.filter((item) => item.type === "folder").map((item) => item.id)));
            addConsoleMessage(
                ConsoleMessageMods.SUCCESS,
                "Workspace imported successfully",
            );
        } catch {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Failed to import workspace",
            );
        }

        if (workspaceInputRef.current) {
            workspaceInputRef.current.value = "";
        }
    };

    const handleDeployClick = (): void => {
        if (!deployableFile) {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Please select a file with contract code to deploy",
            );

            return;
        }

        deployContractState.requestDeploy(
            deployableFile.content,
            deployableFile.name,
        );
    };

    const handleExploreClick = (): void => {
        if (!deployableFile) {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Please select a file with contract code to explore",
            );

            return;
        }

        deployContractState.requestExplore(
            deployableFile.content,
            deployableFile.name,
        );
    };

    const toggleFolder = (folderId: string): void => {
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

    const value: IDeployProModeContextValue = {
        ...deployContractState,
        isActive,
        items,
        activeFileId,
        openFiles,
        expandedFolders,
        fileInputRef,
        workspaceInputRef,
        contextMenu,
        renamingId,
        newName,
        consoleMessages,
        monacoInitialized,
        darkMode,
        activeFile,
        deployableFile,
        phloLimit,
        phloPrice,
        setActiveFileId,
        setOpenFiles,
        setContextMenu,
        setNewName,
        setRenamingId,
        handleEditorChange,
        handleNewFile,
        handleNewFolder,
        handleCloseFile,
        handleDelete,
        handleRename,
        handleImportFile,
        handleImportWorkspace,
        handleDeployClick,
        handleExploreClick,
        handleLoadExample,
        clearConsole: () => setConsoleMessages([]),
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
    const { items, workspaceInputRef, handleLoadExample } = useDeployProMode();
    const { isTablet } = useScreen();

    const adaptiveButtonLabelStyle: CSSProperties = useMemo(
        () => (!isTablet ? {} : { fontSize: "0.875rem" }),
        [isTablet],
    );

    return (
        <ToolbarActions style={isTablet ? { flexDirection: "column", gap: 16 } : undefined}>
            <Button
                id="ide-load-example-button"
                style={defaultButtonStyle}
                fullWidth={isTablet}
                onClick={handleLoadExample}
            >
                Load Example
            </Button>
            <Button
                id="ide-import-workspace-button"
                variant="secondary"
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
        isActive,
        account,
        isBalanceReady,
        isPhloLimitValid,
        isBlockedByAnotherChainOperation,
        submittedDeployId,
        submittedDeployStatus,
        unresolvedReason,
        isWaitingForConfirmation,
        isDeployConfirmed,
        items,
        activeFileId,
        openFiles,
        expandedFolders,
        fileInputRef,
        workspaceInputRef,
        contextMenu,
        renamingId,
        newName,
        consoleMessages,
        monacoInitialized,
        darkMode,
        activeFile,
        deployableFile,
        phloLimit,
        phloPrice,
        pendingTerm,
        pendingFileName,
        isProcessing,
        isDeployConfirmationOpen,
        isExploreConfirmationOpen,
        passwordPrompt,
        confirmDeploy,
        confirmExplore,
        cancel,
        setActiveFileId,
        setOpenFiles,
        setContextMenu,
        setNewName,
        setRenamingId,
        handleEditorChange,
        handleNewFile,
        handleNewFolder,
        handleCloseFile,
        handleDelete,
        handleRename,
        handleImportFile,
        handleImportWorkspace,
        handleDeployClick,
        handleExploreClick,
        clearConsole,
        toggleFolder,
    } = useDeployProMode();

    const contextMenuRef = useRef<HTMLDivElement>(null);
    const contextMenuOpenerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!contextMenu || !isActive) return;

        contextMenuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setContextMenu(null);
            contextMenuOpenerRef.current?.focus();
        };
        const handleMouseDown = (event: MouseEvent): void => {
            if (!contextMenuRef.current?.contains(event.target as Node)) {
                const opener = contextMenuOpenerRef.current;
                setContextMenu(null);
                window.setTimeout(() => {
                    const focused = document.activeElement;
                    if (
                        opener?.isConnected &&
                        !opener.closest('[aria-hidden="true"]') &&
                        (focused === document.body || !focused?.isConnected)
                    ) {
                        opener.focus();
                    }
                }, 0);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleMouseDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, [contextMenu, isActive, setContextMenu]);

    const openContextMenu = (item: IDEItem, x: number, y: number, opener: HTMLElement): void => {
        contextMenuOpenerRef.current = opener;
        setContextMenu({ item, x, y });
    };

    const closeContextMenu = (): void => {
        setContextMenu(null);
        contextMenuOpenerRef.current?.focus();
    };

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
                        role="treeitem"
                        tabIndex={0}
                        aria-expanded={expandedFolders.has(folder.id)}
                        onClick={() => toggleFolder(folder.id)}
                        onKeyDown={(e) => {
                            if (e.target !== e.currentTarget) return;
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleFolder(folder.id);
                            } else if (e.key === "F10" && e.shiftKey) {
                                e.preventDefault();
                                const rect = e.currentTarget.getBoundingClientRect();
                                openContextMenu(folder, rect.left, rect.bottom, e.currentTarget);
                            }
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            openContextMenu(folder, e.clientX, e.clientY, e.currentTarget);
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
                                    if (e.key === "Enter") {
                                        handleRename(folder, newName);
                                    }
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
                    role="treeitem"
                    tabIndex={0}
                    aria-selected={file.id === activeFileId}
                    onClick={() => {
                        setActiveFileId(file.id);

                        if (!openFiles.includes(file.id)) {
                            setOpenFiles((prev) => [...prev, file.id]);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setActiveFileId(file.id);
                            if (!openFiles.includes(file.id)) {
                                setOpenFiles((prev) => [...prev, file.id]);
                            }
                        } else if (e.key === "F10" && e.shiftKey) {
                            e.preventDefault();
                            const rect = e.currentTarget.getBoundingClientRect();
                            openContextMenu(file, rect.left, rect.bottom, e.currentTarget);
                        }
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        openContextMenu(file, e.clientX, e.clientY, e.currentTarget);
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
                                if (e.key === "Enter") {
                                    handleRename(file, newName);
                                }
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
                aria-label="Import Rholang file"
                accept=".rho"
                onChange={handleImportFile}
            />
            <FileInput
                ref={workspaceInputRef}
                type="file"
                aria-label="Import workspace file"
                accept=".json"
                onChange={handleImportWorkspace}
            />

            <MainContent>
                <FileExplorer>
                    <ExplorerHeader>Files</ExplorerHeader>
                    <FileExplorerContent className="file-explorer-content">
                        <FileList>
                        <FileTree role="tree" aria-label="Workspace files">{renderFileTree()}</FileTree>
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
                    <EditorHeader role="tablist" aria-label="Open files">
                        <h4 className="light">Rholang Code</h4>
                        {openFiles.map((fileId) => {
                            const file = items.find(
                                (item) =>
                                    item.id === fileId && item.type === "file",
                            ) as IDEFile | undefined;

                            if (!file) {
                                return null;
                            }

                            return (
                                <TabItem
                                    key={fileId}
                                    $active={fileId === activeFileId}
                                >
                                    <TabSelect
                                        role="tab"
                                        aria-selected={fileId === activeFileId}
                                        className="text-3"
                                        onClick={() => setActiveFileId(fileId)}
                                    >
                                        {file.name}
                                        {file.modified ? "*" : ""}
                                    </TabSelect>
                                    <CloseButton
                                        aria-label={`Close ${file.name}`}
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
                        onClick={handleDeployClick}
                        loading={isProcessing}
                        disabled={
                            isProcessing ||
                            isBlockedByAnotherChainOperation ||
                            !deployableFile ||
                            !account ||
                            !isBalanceReady ||
                            !isPhloLimitValid
                        }
                    >
                        <h3>Deploy</h3>
                    </Button>
                    <Button
                        id="ide-explore-button"
                        size="small"
                        variant="secondary"
                        onClick={handleExploreClick}
                        loading={isProcessing}
                        disabled={isProcessing || isBlockedByAnotherChainOperation || !deployableFile}
                    >
                        <h3>Explore</h3>
                    </Button>
                    <Button
                        aria-label="Clear console output"
                        variant="danger"
                        size="small"
                        onClick={clearConsole}
                    >
                        <span>Clear</span>
                        <DeleteIcon />
                    </Button>
                </DeploySettings>
            </Toolbar>

            {submittedDeployId && (
                <DeployStatusPanel
                    role="status"
                    $tone={unresolvedReason ? "warning" : isDeployConfirmed ? "success" : "info"}
                >
                    <div>
                        <strong>{unresolvedReason ? "Deploy status unknown" : isDeployConfirmed ? "Deploy finalized" : isWaitingForConfirmation ? "Deploy pending" : "Deploy sent"}</strong>
                        {submittedDeployStatus && <span> · {submittedDeployStatus}</span>}
                        {unresolvedReason && <div>{unresolvedReason}</div>}
                        <code>Deploy ID: {submittedDeployId}</code>
                    </div>
                    <Button
                        variant="secondary"
                        size="small"
                        aria-label="Copy deploy hash"
                        onClick={async () => {
                            try {
                                await navigator.clipboard.writeText(submittedDeployId);
                            } catch {
                                // Clipboard permissions are controlled by the browser.
                            }
                        }}
                    >
                        Copy hash
                    </Button>
                </DeployStatusPanel>
            )}

            <ConsolePanel>
                <OutputHeader>
                    <h4>Console</h4>
                </OutputHeader>
                <OutputContent role="log" aria-label="Deploy console" aria-live="polite">
                    {consoleMessages.map((message) => (
                        <ConsoleEntry key={message.id} $type={message.type}>
                            {message.type === ConsoleMessageMods.SUCCESS && (
                                <SuccessIcon size={14} />
                            )}
                            {message.type === ConsoleMessageMods.ERROR && (
                                <ErrorIcon size={14} />
                            )}
                            {message.type === ConsoleMessageMods.INFO && (
                                <PendingIcon size={14} />
                            )}
                            <span>
                                [{message.timestamp.toLocaleTimeString()}]{" "}
                                {message.message}
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
                    ref={contextMenuRef}
                    role="menu"
                    aria-label={`${contextMenu.item.name} actions`}
                    $x={contextMenu.x}
                    $y={contextMenu.y}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item.type === "folder" && (
                        <>
                            <ContextMenuItem
                                role="menuitem"
                                onClick={() => {
                                    handleNewFile(contextMenu.item.id);
                                    closeContextMenu();
                                }}
                            >
                                New File
                            </ContextMenuItem>
                            <ContextMenuItem
                                role="menuitem"
                                onClick={() => {
                                    handleNewFolder(contextMenu.item.id);
                                    closeContextMenu();
                                }}
                            >
                                New Folder
                            </ContextMenuItem>
                        </>
                    )}
                    {contextMenu.item.type === "file" && (
                        <ContextMenuItem
                            role="menuitem"
                            onClick={() => {
                                IDEStorageService.exportFile(
                                    contextMenu.item as IDEFile,
                                );
                                closeContextMenu();
                            }}
                        >
                            Export File
                        </ContextMenuItem>
                    )}
                    <ContextMenuItem
                        role="menuitem"
                        onClick={() => {
                            setRenamingId(contextMenu.item.id);
                            setNewName(contextMenu.item.name);
                            closeContextMenu();
                        }}
                    >
                        Rename
                    </ContextMenuItem>
                    <ContextMenuItem
                        role="menuitem"
                        onClick={() => {
                            handleDelete(contextMenu.item);
                            closeContextMenu();
                        }}
                    >
                        Delete
                    </ContextMenuItem>
                </ContextMenu>
            )}

            <DeploymentConfirmationModal
                isOpen={isDeployConfirmationOpen}
                onClose={cancel}
                onConfirm={confirmDeploy}
                rholangCode={pendingTerm}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={account?.name || ""}
                accountAddress={account?.address || ""}
                fileName={pendingFileName}
                loading={isProcessing}
            />

            <DeploymentConfirmationModal
                isOpen={isExploreConfirmationOpen}
                onClose={cancel}
                onConfirm={confirmExplore}
                rholangCode={pendingTerm}
                phloLimit={phloLimit}
                phloPrice={phloPrice}
                accountName={account?.name || ""}
                accountAddress={account?.address || ""}
                fileName={pendingFileName}
                isExplore
                loading={isProcessing}
            />

            <PasswordModal
                {...passwordPrompt}
                onClose={cancel}
                title="Enter password to deploy"
                description="Your wallet session has expired. Enter your password to sign and deploy this contract."
            />
        </IDEContainer>
    );
};

export const DeployProModeWidget = Object.assign(DeployProModeWidgetRoot, {
    Actions: DeployProModeActions,
    Board: DeployProModeBoard,
});
