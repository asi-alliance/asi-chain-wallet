export declare enum NodeApiProfile {
    SCALA = "scala",
    RUST = "rust"
}
export declare enum NodeApiProfileStability {
    STABLE = "stable",
    EXPERIMENTAL = "experimental"
}
export declare const DEFAULT_NODE_API_PROFILE: NodeApiProfile;
export declare const NODE_API_PROFILES: NodeApiProfile[];
export interface INodeApiProfileDescriptor {
    profile: NodeApiProfile;
    label: string;
    description: string;
    stability: NodeApiProfileStability;
}
export declare const NODE_API_PROFILE_DESCRIPTORS: Record<NodeApiProfile, INodeApiProfileDescriptor>;
