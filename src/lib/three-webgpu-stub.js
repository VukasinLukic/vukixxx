// Stub for three/webgpu - react-force-graph-3d tries to import this but it doesn't exist
// in older Three.js versions. We stub it to use WebGLRenderer instead.

import { WebGLRenderer } from 'three';

// WebGPURenderer stub - falls back to WebGLRenderer
export class WebGPURenderer extends WebGLRenderer {
    constructor(parameters = {}) {
        super(parameters);
        this.isWebGPURenderer = false;
    }
}

export default { WebGPURenderer };
