import React, {
    createContext,
    CSSProperties,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import { RootState } from "store";
import {
    Button,
    DeploymentConfirmationModal,
    PasswordModal,
} from "components";
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
    color: ${({ theme, $type }) =>
        $type === ConsoleMessageMods.ERROR
            ? theme.danger
            : $type === ConsoleMessageMods.SUCCESS
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
    children: React.ReactNode;
}

const DeployProModeWidgetRoot: React.FC<IDeployProModeWidgetProps> = ({
    phloLimit,
    phloPrice,
    children,
}) => {
    const darkMode = useSelector((state: RootState) => state.theme.darkMode);

    const [monacoInitialized, setMonacoInitialized] = useState(false);
    const [items, setItems] = useState<IDEItem[]>([]);
    const [activeFileId, setActiveFileId] = useState<string>("");
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(["examples-folder", "contracts-folder"]),
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

    useEffect(() => {
        registerRholangLanguage();
        setMonacoInitialized(true);
    }, []);

    useEffect(() => {
        const loadedItems = IDEStorageService.loadFiles();
        setItems(loadedItems);

        const workspaceState = IDEStorageService.loadWorkspaceState();

        if (workspaceState) {
            setActiveFileId(workspaceState.activeFileId || "");
            setOpenFiles(workspaceState.openFiles || []);
            setExpandedFolders(new Set(workspaceState.expandedFolders || []));

            return;
        }

        const defaultFile = loadedItems.find((item) => item.id === "hello-rho");

        if (defaultFile) {
            setActiveFileId(defaultFile.id);
            setOpenFiles([defaultFile.id]);
        }
    }, []);

    useEffect(() => {
        if (items.length > 0) {
            IDEStorageService.saveFiles(items);
        }
    }, [items]);

    useEffect(() => {
        IDEStorageService.saveWorkspaceState({
            activeFileId,
            openFiles,
            expandedFolders: Array.from(expandedFolders),
        });
    }, [activeFileId, openFiles, expandedFolders]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);

        document.addEventListener("click", handleClick);

        return () => document.removeEventListener("click", handleClick);
    }, []);

    const activeFile = items.find(
        (item) => item.id === activeFileId && item.type === "file",
    ) as IDEFile | undefined;

    const addConsoleMessage = (
        type: ConsoleMessageMods,
        message: string,
    ): void => {
        consoleMessageIdRef.current += 1;

        setConsoleMessages((prev) => [
            ...prev,
            {
                id: consoleMessageIdRef.current.toString(),
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
        if (!value || !activeFile) {
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

    const handleNewFolder = (parentId?: string): void => {
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

    const handleCloseFile = (fileId: string): void => {
        const nextOpenFiles = openFiles.filter((id) => id !== fileId);

        setOpenFiles(nextOpenFiles);

        if (activeFileId === fileId && nextOpenFiles.length > 0) {
            setActiveFileId(nextOpenFiles[nextOpenFiles.length - 1]);
        }
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
        if (!activeFile) {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Please select a file to deploy",
            );

            return;
        }

        deployContractState.requestDeploy(activeFile.content, activeFile.name);
    };

    const handleExploreClick = (): void => {
        if (!activeFile) {
            addConsoleMessage(
                ConsoleMessageMods.ERROR,
                "Please select a file to explore",
            );

            return;
        }

        deployContractState.requestExplore(activeFile.content, activeFile.name);
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
        account,
        isBalanceReady,
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
        phloLimit,
        phloPrice,
        pendingTerm,
        pendingFileName,
        isProcessing,
        isDeployConfirmationOpen,
        isExploreConfirmationOpen,
        isPasswordModalOpen,
        passwordError,
        confirmDeploy,
        confirmExplore,
        submitPassword,
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
                        disabled={!activeFile || !account || !isBalanceReady}
                    >
                        <h3>Deploy</h3>
                    </Button>
                    <Button
                        id="ide-explore-button"
                        size="small"
                        variant="secondary"
                        onClick={handleExploreClick}
                        loading={isProcessing}
                        disabled={!activeFile}
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
                    $x={contextMenu.x}
                    $y={contextMenu.y}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item.type === "folder" && (
                        <>
                            <ContextMenuItem
                                onClick={() => {
                                    handleNewFile(contextMenu.item.id);
                                    setContextMenu(null);
                                }}
                            >
                                New File
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => {
                                    handleNewFolder(contextMenu.item.id);
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
                isOpen={isPasswordModalOpen}
                onClose={cancel}
                onConfirm={submitPassword}
                title="Enter password to deploy"
                description="Your wallet session has expired. Enter your password to sign and deploy this contract."
                loading={isProcessing}
                error={passwordError}
            />
        </IDEContainer>
    );
};

export const DeployProModeWidget = Object.assign(DeployProModeWidgetRoot, {
    Actions: DeployProModeActions,
    Board: DeployProModeBoard,
});
