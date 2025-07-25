<template>
  <div class="thompson-rules space-y-8">
    <div class="rules-container space-y-8">
      <!-- 拓广图 -->
      <div class="rule-section bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="rule-title text-lg font-bold text-blue-800 mb-2">拓广图</div>
        <div class="rule-diagram before-after flex items-center gap-4">
          <div class="before flex flex-col items-center">
            <div class="before-title text-sm text-gray-500 mb-1">初始</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="initialNodes"
                :edges="initialEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
        </div>
      </div>
      <!-- 或规则 -->
      <div class="rule-section bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="rule-title text-lg font-bold text-blue-800 mb-2">或 | 规则</div>
        <div class="rule-diagram before-after flex items-center gap-4">
          <div class="before flex flex-col items-center">
            <div class="before-title text-sm text-gray-500 mb-1">初始</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="orBeforeNodes"
                :edges="orBeforeEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
          <span class="arrow text-3xl font-bold text-blue-400">⟶</span>
          <div class="after flex flex-col items-center">
            <div class="after-title text-sm text-gray-500 mb-1">转换</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="orAfterNodes"
                :edges="orAfterEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
        </div>
      </div>
      <!-- 连接规则 -->
      <div class="rule-section bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="rule-title text-lg font-bold text-blue-800 mb-2">连接 · 规则</div>
        <div class="rule-diagram before-after flex items-center gap-4">
          <div class="before flex flex-col items-center">
            <div class="before-title text-sm text-gray-500 mb-1">初始</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="concatBeforeNodes"
                :edges="concatBeforeEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
          <span class="arrow text-3xl font-bold text-blue-400">⟶</span>
          <div class="after flex flex-col items-center">
            <div class="after-title text-sm text-gray-500 mb-1">转换</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="concatAfterNodes"
                :edges="concatAfterEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
        </div>
      </div>
      <!-- 闭包规则 -->
      <div class="rule-section bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="rule-title text-lg font-bold text-blue-800 mb-2">闭包 * 规则</div>
        <div class="rule-diagram before-after flex items-center gap-4">
          <div class="before flex flex-col items-center">
            <div class="before-title text-sm text-gray-500 mb-1">初始</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="closureBeforeNodes"
                :edges="closureBeforeEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
          <span class="arrow text-3xl font-bold text-blue-400">⟶</span>
          <div class="after flex flex-col items-center">
            <div class="after-title text-sm text-gray-500 mb-1">转换</div>
            <div class="rule-flow w-96 h-28 bg-white border border-gray-200 rounded relative">
              <VueFlow
                :nodes="closureAfterNodes"
                :edges="closureAfterEdges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :fit-view="true"
                :zoom-on-scroll="false"
                :zoom-on-double-click="false"
                :pan-on-drag="false"
                :nodes-draggable="false"
                :nodes-connectable="false"
                :elements-selectable="false"
                :default-viewport="{ zoom: 1 }"
                style="pointer-events: none;"
              >
                <svg>
                  <defs>
                    <marker
                      id="rule-arrow"
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                </svg>
              </VueFlow>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { VueFlow } from '@vue-flow/core'
import CircleNode from './nodes/CircleNode.vue'
import CustomEdge from './edges/CustomEdge.vue'

const nodeTypes = { circle: CircleNode }
const edgeTypes = { custom: CustomEdge }

const initialNodes = shallowRef([
  { id: 'X', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'X' } },
  { id: 'Y', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Y', double: true } }
])
const initialEdges = shallowRef([
  {
    id: 'e1',
    source: 'X',
    target: 'Y',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'R' }
  }
])

const orBeforeNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const orBeforeEdges = shallowRef([
  {
    id: 'or-b',
    source: 'Si',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r1|r2' }
  }
])
const orAfterNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const orAfterEdges = shallowRef([
  {
    id: 'or-a1',
    source: 'Si',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r1', controlOffset: { x: 0, y: -30 } }
  },
  {
    id: 'or-a2',
    source: 'Si',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r2', controlOffset: { x: 0, y: 30 } }
  }
])

const concatBeforeNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const concatBeforeEdges = shallowRef([
  {
    id: 'concat-b',
    source: 'Si',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r1r2' }
  }
])
const concatAfterNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sk', type: 'circle', position: { x: 185, y: 56 }, data: { text: 'Sk' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const concatAfterEdges = shallowRef([
  {
    id: 'concat-a1',
    source: 'Si',
    target: 'Sk',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r1' }
  },
  {
    id: 'concat-a2',
    source: 'Sk',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r2' }
  }
])

const closureBeforeNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const closureBeforeEdges = shallowRef([
  {
    id: 'closure-b',
    source: 'Si',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'r1*' }
  }
])
const closureAfterNodes = shallowRef([
  { id: 'Si', type: 'circle', position: { x: 50, y: 56 }, data: { text: 'Si' } },
  { id: 'Sk', type: 'circle', position: { x: 185, y: 40 }, data: { text: 'Sk' } },
  { id: 'Sj', type: 'circle', position: { x: 320, y: 56 }, data: { text: 'Sj' } }
])
const closureAfterEdges = shallowRef([
  {
    id: 'closure-a1',
    source: 'Si',
    target: 'Sk',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'ε' }
  },
  {
    id: 'closure-a2',
    source: 'Sk',
    target: 'Sj',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    data: { label: 'ε' }
  },
  {
    id: 'closure-a3',
    source: 'Sk',
    target: 'Sk',
    type: 'custom',
    markerEnd: 'url(#rule-arrow)',
    style: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 2' },
    data: { label: 'r1', controlOffset: { x: -100, y: -90 } }
  }
])
</script>

<style scoped>
/* 移除所有 @apply 指令，样式已移到模板 class 中 */
</style>
