# Changelog

## [0.0.5] - 2025 - 02 - 22

### Added

- 新增 KeyboardManager 管理键盘事件
- 新增功能：全选快捷键

### Removed

- 移除 EditableText 组件，改为使用 TextInputTool 组件显示文本输入框

### Changed

- [LIN-43: feature：右键对卡片进行排序](https://linear.app/linearuser/issue/LIN-43/feature：右键对卡片进行排序)
- [LIN-46: improvement：梳理发布/订阅模式以及 Public 方法，解决 BoxSelection 与 Whiteboard 递归引用问题](https://linear.app/linearuser/issue/LIN-46/improvement：梳理发布订阅模式以及public方法，解决boxselection与whiteboard递归引用问题)
- [LIN-34: BUG：Toolbar 无法跟随 Card 移动](https://linear.app/linearuser/issue/LIN-34/bug：toolbar无法跟随card移动)
- [LIN-33: improve：Card 编辑结束的逻辑应该由 Card 处理，而不是 TextInputTool 处理](https://linear.app/linearuser/issue/LIN-33/improve：card编辑结束的逻辑应该由card处理，而不是textinputtool处理)
- [LIN-29: bug：TextInputTool 无法被释放](https://linear.app/linearuser/issue/LIN-29/bug：textinputtool无法被释放)
- [LIN-28: improve：BoxSelection 的 getSelectedElement 和 getSelectedElements 功能重复](https://linear.app/linearuser/issue/LIN-28/improve：boxselection的getselectedelement和getselectedelements功能重复)
- [LIN-27: feature：支持批量删除](https://linear.app/linearuser/issue/LIN-27/feature：支持批量删除)
- [LIN-26: feature：BoxSelection 实时选择](https://linear.app/linearuser/issue/LIN-26/feature：boxselection实时选择)
- [LIN-49: feature：完善右键排序功能](https://linear.app/linearuser/issue/LIN-49/feature：完善右键排序功能)
- [LIN-48: improvement：重构所有 UIOverayManager 的实现方式，改为发布/订阅模式](https://linear.app/linearuser/issue/LIN-48/improvement：重构所有uioveraymanager的实现方式，改为发布订阅模式)
- [LIN-21: feat：实现全选快捷键](https://linear.app/linearuser/issue/LIN-21/feat：实现全选快捷键)
- [LIN-20: feat：把内容输入框从 EditableText 改到使用 UIOverlayManager 实现](https://linear.app/linearuser/issue/LIN-20/feat：把内容输入框从editabletext改到使用uioverlaymanager实现)
- [LIN-19: bug：fix：InputTool 显示位置不正确](https://linear.app/linearuser/issue/LIN-19/bug：fix：inputtool显示位置不正确)
- [LIN-18: bug：TextInputTool 以及 Toolbar 不能跟随屏幕移动](https://linear.app/linearuser/issue/LIN-18/bug：textinputtool以及toolbar不能跟随屏幕移动)

## [0.0.4] - 2024 - 12 - 30

### Added

- endDraw 函数，根据选中内容的边界渲染矩形
- 允许使用触摸的 Tap 逻辑

### Fixed

- 触摸无需等待 0.25s，直接触发 Tap 逻辑
- 解决双击内容无法编辑的 bug（在 Editabletext 组件添加事件延时）
- 解决 CTRL+A 全选 UIOverlay 的 bug
- 解决工具栏无法跟随卡片移动的 bug
- 解决使用事件委托时，右键菜单不显示的 bug
- 解决无法框选内容的 bug
- 解决在 UIOverlay 组件中双指缩放，会导致整个页面缩放的 bug
- 解决双指只 pinching 无法 panning 的 bug

### Changed

- 重构 UIOverlayManager ，使用 Lit 库替代原生的 Dom 实现

## [0.0.3] - 2024-12-28

### Changed

- 优化编辑逻辑，双击 EditableText 经常误触，改为双击卡片进行内容的修改
- 手指触摸卡片时不会触发拖动卡片，而是 Panning 屏幕（拖动卡片遵循移动端 0.25s 逻辑）

### Added

- 新增 UiOverlayManager，用于管理 UI 元素的显示和隐藏
- 使用 esbuild 进行打包，优化打包速度
- 添加触摸板双指拖动功能。
- 实现简易工具栏
- 实现简易组件栏
- 实现简易右键菜单
- 实现触摸 0.25s 逻辑

### Refactor

- 重构 GestureManager 为 ClickEventManager
- 重构拖动部分，是针对选中元素添加拖动事件进行拖动而不是针对单一元素，使用 WhiteManager 统一管理（事件委托）

### Removed

- 移除 CardDraggableManager，改为统一使用 BoxSelection 实现拖动

## [0.0.2] - 2024-12-26

### Added

- 添加触摸板双指缩放功能。
- 添加触摸板双指拖动功能。
- 添加白板批量框选（BoxSelection）功能。
- 添加错误弹窗功能。
- 添加移动无限画布时的真实力模拟。
- Card 的标签能够显示在卡片下侧

### Fixed

- 修复 bug：双指拖动，将一个手指移出触摸位置后，监控的触摸点不会消失，导致只使用一根手指也可以缩放，而无法拖动问题

- 修复 bug：手机端很难通过双击修改卡片，在移动卡片时增加 offset，使双击双击更容易

### Changed

- 重构 WhiteBoardManager，优化代码结构和命名规范，提升白板交互代码的可读性和可维护性。
- 选择状态优化，删除 WhiteBoard 的 selection，改到 BoxSelection

## [0.0.1] - 2024-12-01

### Added

- **卡片交互功能**

  - 支持拖动卡片。
  - 双击新建卡片。
  - 支持拖动卡片至其他卡片，设为子项。
  - 支持修改卡片内容。
  - 实现卡片选中时的蓝色描边效果。
  - 实现删除卡片功能。

- **白板核心功能**

  - 实现无限拖动的画布逻辑。
  - 支持触摸板双指拖动页面。
  - 支持双指捏合缩放画布。
  - 实现卡片自动排列逻辑。
  - 添加简单的 Napkin 白板搜索功能。

- **数据与构建支持**
  - 实现基础内容数据建模。
  - 使用 RxDB 作为数据源。
  - 支持 Monorepo 打包，并成功导入到 NFIB。
  - 使用 Typedoc 生成项目文档。

### Improved

- 优化 **WhiteDragManager**，在双指缩放时也能正确拖动卡片。

### Performance

- 优化 **GestureManager** 的双指缩放逻辑，使交互更平滑流畅。
