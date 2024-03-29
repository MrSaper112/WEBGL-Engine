// import { Program } from "../../../../node_modules/typescript/lib/typescript"

import { Figure, Vector3D } from "../primitives/Figure";
import FigureInterface, { generateUUID } from "../../addons/FiguresInterFace";
import { programArray } from "../../addons/interfaces/WebglExtender";
import { KeyboardAndMouse, Keys } from "../../addons/KeyboardAndMouse";
import Matrix4D from "../../addons/Matrix4D";
import RayCaster from "../../addons/RayCaster";
import { Engine } from "../../Engine";
import { mat4, quat, vec3, vec4 } from "../../math/gl-matrix";
import { xRotate, yRotate, zRotate } from "../../math/gl-matrix/Matrix4D";
import Quat from "../../math/Quat";
import Materials from "../Materials";
import Camera from "./Camera";
let rotateY = 0;  // For rotating along the Y axis
let fronBackMovement = 0;   // Front and back movement
let sideMovement = 0;  // Movement from side to side


export default class FreeMoveCamera extends Camera {
    _fov?: number;
    _zNear?: number;
    _zFar?: number;
    _keyboardAndMouseManager?: KeyboardAndMouse;
    _acceleration?: number;
    _aroundSpeed?: number;
    _rayCaster: RayCaster;
    _keyboardWork: boolean = true
    constructor(
        data: {
            fov?: number;
            aspect?: number;
            zNear?: number;
            zFar?: number;
            acceleration?: number;
            keys?: Keys;
            aroundSpeed?: number;
            keyboard?: KeyboardAndMouse;
            keyboardWork?: boolean;
        },
        vector?: vec3,
        scale?: vec3,
        rotation?: quat

    ) {
        super(vector, scale, rotation);

        this._fov = new Matrix4D().degToRad(data.fov || 60);
        this._aspect = Engine._gl.gl.canvas.width / Engine._gl.gl.canvas.height;

        this._zNear = data.zNear || 0.1;
        this._zFar = data.zFar || 10000.0;

        this._acceleration = data.acceleration || 500;
        this._aroundSpeed = data.aroundSpeed || 0.05;
        this._vector = vector

        this._keyboardWork = data.keyboardWork
        this._keyboardAndMouseManager = data.keyboard || (this._keyboardWork ? new KeyboardAndMouse({
            keyboardWork: true,
            mouseWork: true,
            keys: {
                KeyS: false,
                KeyW: false,
                KeyA: false,
                KeyD: false,
                Space: false,
                ShiftLeft: false,
            }
        }) : undefined);

        // document.addEventListener("resize", () => {
        //     this._aspect = Engine._gl.gl.canvas.width / Engine._gl.gl.canvas.height
        //     this.generateMatrixOfView()
        // })
        this.generateMatrixOfView()
        this.calculateFrustumPlanes()
        console.log(this.frustumPlanes)
    }
    generateMatrixOfView() {
        this._perspectiveMatrix = mat4.create()
        this._perspectiveMatrix = mat4.perspective(this._perspectiveMatrix, this._fov, this._aspect, this._zNear, this._zFar)

        let modelMatrix = mat4.create()
        modelMatrix = mat4.translate(modelMatrix, modelMatrix, this._vector)


        let m = mat4.create();
        mat4.fromQuat(m, this._rotation)
        mat4.multiply(modelMatrix, modelMatrix, m)

        // modelMatrix = mat4.rotateX(modelMatrix, modelMatrix, this._rotationInDeg[0])
        // modelMatrix = mat4.rotateY(modelMatrix, modelMatrix, this._rotationInDeg[1])
        // modelMatrix = mat4.rotateZ(modelMatrix, modelMatrix, this._rotationInDeg[2])

        // modelMatrix = xRotate(modelMatrix, this._rotationInDeg[0])
        // modelMatrix = yRotate(modelMatrix, this._rotationInDeg[1])
        // modelMatrix = zRotate(modelMatrix, this._rotationInDeg[2])

        modelMatrix = mat4.invert(modelMatrix, modelMatrix)
        this._modelMatrix = modelMatrix


        let mvMatrix = mat4.create();
        mat4.multiply(mvMatrix, this._perspectiveMatrix, this._modelMatrix)
        this._viewProjection = mvMatrix
    }
    updateRotationMatrixQ(): void {
        let m = mat4.create();
        mat4.fromQuat(m, this._rotation)
        mat4.multiply(this._modelMatrix, this._modelMatrix, m)

        // this._modelMatrix = xRotate(this._modelMatrix, this._rotationInDeg[0])
        // this._modelMatrix = yRotate(this._modelMatrix, this._rotationInDeg[1])
        // this._modelMatrix = zRotate(this._modelMatrix, this._rotationInDeg[2])

        // this._modelMatrix = mat4.rotateX(this._modelMatrix, this._modelMatrix, this._rotationInDeg[0])
        // this._modelMatrix = mat4.rotateY(this._modelMatrix, this._modelMatrix, this._rotationInDeg[1])
        // this._modelMatrix = mat4.rotateZ(this._modelMatrix, this._modelMatrix, this._rotationInDeg[2])
    }
    calculateAndMove(deltaTime: number) {
        if (this._keyboardAndMouseManager) {

            const tempForwardDirection = vec3.create();
            const tempSideDirection = vec3.create();
            const upMovementDirection = vec3.create();

            fronBackMovement = 0;
            sideMovement = 0;
            let upMovement = 0;
            let somethingChanged = false
            if (this._keyboardAndMouseManager._keys.KeyW) {
                fronBackMovement = this._acceleration * deltaTime;
                somethingChanged = true
            }
            if (this._keyboardAndMouseManager._keys.KeyA) {
                sideMovement = -this._acceleration * deltaTime;
                somethingChanged = true
            }
            if (this._keyboardAndMouseManager._keys.KeyS) {
                fronBackMovement = -this._acceleration * deltaTime;
                somethingChanged = true
            }
            if (this._keyboardAndMouseManager._keys.KeyD) {
                sideMovement = this._acceleration * deltaTime;
                somethingChanged = true
            }
            if (this._keyboardAndMouseManager._keys.ShiftLeft) {
                upMovement = -this._acceleration * deltaTime;
                somethingChanged = true
            }
            if (this._keyboardAndMouseManager._keys.Space) {
                upMovement = this._acceleration * deltaTime;
                somethingChanged = true
            }

            if (this._keyboardAndMouseManager._mouseWork) {
                this.updateRotationMatrixQ()

                // Rotation
                if (this._keyboardAndMouseManager._positionOfMouse.x != 0) {
                    quat.rotateY(this._rotation, this._rotation, -this._keyboardAndMouseManager._positionOfMouse.x * this._aroundSpeed);  // mouse.movementX is screen movement of the cursor
                    this._keyboardAndMouseManager._positionOfMouse.x = 0;
                    somethingChanged = true
                }

                // // Rotation
                // if (this._keyboardAndMouseManager._positionOfMouse.y != 0) {
                //     this._rotationInDeg[0] -= this._keyboardAndMouseManager._positionOfMouse.y / 20;  // mouse.movementX is screen movement of the cursor

                //     quat.rotateX(q, q, this._keyboardAndMouseManager._positionOfMouse.y / 20);  // mouse.movementX is screen movement of the cursor
                //     this._keyboardAndMouseManager._positionOfMouse.y = 0;
                //     somethingChanged = true
                // }
                this.updateRotationMatrixQ()
            }


            tempForwardDirection[0] = this._modelMatrix[8];
            tempForwardDirection[1] = 0
            tempForwardDirection[2] = this._modelMatrix[10];
            vec3.normalize(tempForwardDirection, tempForwardDirection)

            tempSideDirection[0] = this._modelMatrix[0];
            tempSideDirection[1] = 0
            tempSideDirection[2] = this._modelMatrix[2];

            upMovementDirection[0] = this._modelMatrix[4];
            upMovementDirection[1] = this._modelMatrix[5];
            upMovementDirection[2] = this._modelMatrix[6];
            if (this._keyboardAndMouseManager._keyboardWork) {
                vec3.scaleAndAdd(
                    this._vector,
                    this._vector,
                    tempForwardDirection,
                    -fronBackMovement);
                vec3.scaleAndAdd(
                    this._vector,
                    this._vector,
                    tempSideDirection,
                    sideMovement)

                vec3.scaleAndAdd(
                    this._vector,
                    this._vector,
                    upMovementDirection,
                    upMovement)
            }
            if (somethingChanged) {
                this.generateMatrixOfView()
                this.calculateFrustumPlanes()
                // console.log(this.extractPlanes(this._modelMatrix))
            }
        }

    }
    calculateFrustumPlanes() {
        const planes: Array<vec4> = [];

        const tanHalfFov = Math.tan(this._fov / 2);
        const nearHeight = 2 * tanHalfFov * this._zNear;
        const nearWidth = nearHeight * this._aspect;
        const farHeight = 2 * tanHalfFov * this._zFar;
        const farWidth = farHeight * this._aspect;

        const zAxis = vec3.normalize(vec3.create(), this._vector);
        const xAxis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.fromValues(0, 1, 0), zAxis));
        const yAxis = vec3.cross(vec3.create(), zAxis, xAxis);

        const nearCenter = vec3.add(vec3.create(), this._vector, vec3.scale(vec3.create(), zAxis, this._zNear));
        const farCenter = vec3.add(vec3.create(), this._vector, vec3.scale(vec3.create(), zAxis, this._zFar));

        // Near plane
        const nearPlaneNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), nearCenter, this._vector));
        const nearPlane = vec4.fromValues(nearPlaneNormal[0], nearPlaneNormal[1], nearPlaneNormal[2], -vec3.dot(nearPlaneNormal, nearCenter));
        planes.push(nearPlane);

        // Far plane
        const farPlaneNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), this._vector, farCenter));
        const farPlane = vec4.fromValues(farPlaneNormal[0], farPlaneNormal[1], farPlaneNormal[2], -vec3.dot(farPlaneNormal, farCenter));
        planes.push(farPlane);

        // Left plane
        const leftNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), vec3.add(vec3.create(), nearCenter, vec3.scale(vec3.create(), xAxis, -nearWidth / 2)), this._vector));
        const leftPlane = vec4.fromValues(leftNormal[0], leftNormal[1], leftNormal[2], -vec3.dot(leftNormal, this._vector));
        planes.push(leftPlane);

        // Right plane
        const rightNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), vec3.add(vec3.create(), nearCenter, vec3.scale(vec3.create(), xAxis, nearWidth / 2)), this._vector));
        const rightPlane = vec4.fromValues(rightNormal[0], rightNormal[1], rightNormal[2], -vec3.dot(rightNormal, this._vector));
        planes.push(rightPlane);

        // Top plane
        const topNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), vec3.add(vec3.create(), nearCenter, vec3.scale(vec3.create(), yAxis, nearHeight / 2)), this._vector));
        const topPlane = vec4.fromValues(topNormal[0], topNormal[1], topNormal[2], -vec3.dot(topNormal, this._vector));
        planes.push(topPlane);

        // Bottom plane
        const bottomNormal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), vec3.add(vec3.create(), nearCenter, vec3.scale(vec3.create(), yAxis, -nearHeight / 2)), this._vector));
        const bottomPlane = vec4.fromValues(bottomNormal[0], bottomNormal[1], bottomNormal[2], -vec3.dot(bottomNormal, this._vector));
        planes.push(bottomPlane);

        // return planes;



        var left = vec4.fromValues(this._viewProjection[3] + this._viewProjection[0], this._viewProjection[7] + this._viewProjection[4], this._viewProjection[11] + this._viewProjection[8], this._viewProjection[15] + this._viewProjection[12]);
        var right = vec4.fromValues(this._viewProjection[3] - this._viewProjection[0], this._viewProjection[7] - this._viewProjection[4], this._viewProjection[11] - this._viewProjection[8], this._viewProjection[15] - this._viewProjection[12]);
        var top = vec4.fromValues(this._viewProjection[3] - this._viewProjection[1], this._viewProjection[7] - this._viewProjection[5], this._viewProjection[11] - this._viewProjection[9], this._viewProjection[15] - this._viewProjection[13]);
        var bottom = vec4.fromValues(this._viewProjection[3] + this._viewProjection[1], this._viewProjection[7] + this._viewProjection[5], this._viewProjection[11] + this._viewProjection[9], this._viewProjection[15] + this._viewProjection[13]);
        var near = vec4.fromValues(this._viewProjection[3] + this._viewProjection[2], this._viewProjection[7] + this._viewProjection[6], this._viewProjection[11] + this._viewProjection[10], this._viewProjection[15] + this._viewProjection[14]);
        var far = vec4.fromValues(this._viewProjection[3] - this._viewProjection[2], this._viewProjection[7] - this._viewProjection[6], this._viewProjection[11] - this._viewProjection[10], this._viewProjection[15] - this._viewProjection[14]);

        this.frustumPlanes = [left, right, top, bottom, near, far]


        // Extract frustum planes from the projection matrix
        // Left plane
        planes[0] = vec4.fromValues(
            this._viewProjection[3] + this._viewProjection[0],
            this._viewProjection[7] + this._viewProjection[4],
            this._viewProjection[11] + this._viewProjection[8],
            this._viewProjection[15] + this._viewProjection[12]
        );
        // Right plane
        planes[1] = vec4.fromValues(
            this._viewProjection[3] - this._viewProjection[0],
            this._viewProjection[7] - this._viewProjection[4],
            this._viewProjection[11] - this._viewProjection[8],
            this._viewProjection[15] - this._viewProjection[12]
        );
        // Bottom plane
        planes[2] = vec4.fromValues(
            this._viewProjection[3] + this._viewProjection[1],
            this._viewProjection[7] + this._viewProjection[5],
            this._viewProjection[11] + this._viewProjection[9],
            this._viewProjection[15] + this._viewProjection[13]
        );
        // Top plane
        planes[3] = vec4.fromValues(
            this._viewProjection[3] - this._viewProjection[1],
            this._viewProjection[7] - this._viewProjection[5],
            this._viewProjection[11] - this._viewProjection[9],
            this._viewProjection[15] - this._viewProjection[13]
        );
        // Near plane
        planes[4] = vec4.fromValues(
            this._viewProjection[3] + this._viewProjection[2],
            this._viewProjection[7] + this._viewProjection[6],
            this._viewProjection[11] + this._viewProjection[10],
            this._viewProjection[15] + this._viewProjection[14]
        );
        // Far plane
        planes[5] = vec4.fromValues(
            this._viewProjection[3] - this._viewProjection[2],
            this._viewProjection[7] - this._viewProjection[6],
            this._viewProjection[11] - this._viewProjection[10],
            this._viewProjection[15] - this._viewProjection[14]
        );

        // Normalize the planes
        for (let i = 0; i < planes.length; i++) {
            const plane = planes[i];
            const len = vec3.length(vec3.fromValues(plane[0], plane[1], plane[2]));
            planes[i] = vec4.scale(planes[i], planes[i], 1 / len);
        }

        // this.frustumPlanes = [leftPlane, rightPlane, topPlane, bottomPlane, nearPlane, farPlane]
    }
}
