import React, { useEffect } from "react"
import { EditorStep } from "../mini-editor"
import { InnerCode, updateEditorStep } from "./code"
import { Scroller, Step as ScrollerStep } from "../scroller"
import { Preview, PresetConfig } from "./preview"
import { LinkableSection } from "./section"
import { extractPreviewSteps } from "./steps"
import { Swap } from "./ssmq"
import { StaticStepContext } from "./slots"
import Image from 'next/image'
import {
  CodeConfigProps,
  ElementProps,
  GlobalConfig,
} from "../core/types"

type ScrollycodingProps = {
  globalConfig: GlobalConfig
  // data
  children: React.ReactNode
  editorSteps: EditorStep[]
  presetConfig?: PresetConfig
  hasPreviewSteps?: boolean
  // custom props
  staticMediaQuery?: string
  start?: number
  // more things like : rows, showCopyButton, showExpandButton, lineNumbers, staticMediaQuery
} & CodeConfigProps &
  ElementProps

export function Scrollycoding(props: ScrollycodingProps) {
  const staticMediaQuery =
    props.staticMediaQuery ??
    props.globalConfig.staticMediaQuery
  return (
    <Swap
      query={staticMediaQuery}
      staticElement={<StaticScrollycoding {...props} />}
    >
      <DynamicScrollycoding {...props} />
    </Swap>
  )
}

function StaticScrollycoding({
  globalConfig,
  // data
  children,
  editorSteps,
  presetConfig,
  hasPreviewSteps,
  // local config
  staticMediaQuery,
  start = 0,
  // element props:
  className,
  style,
  // code config props
  ...codeConfigProps
}: ScrollycodingProps) {
  const { stepsChildren, previewChildren } =
    extractPreviewSteps(children, hasPreviewSteps)
  return (
    <section
      className={`ch-scrollycoding-static ${
        className || ""
      }`}
      data-ch-theme={globalConfig.themeName}
      style={style}
    >
      {stepsChildren.map((children, i) => (
        <StaticSection
          key={i}
          editorStep={editorSteps[i]}
          previewStep={
            previewChildren && previewChildren[i]
          }
          presetConfig={presetConfig}
          codeConfigProps={codeConfigProps}
          globalConfig={globalConfig}
        >
          {children}
        </StaticSection>
      ))}
    </section>
  )
}

function StaticSection({
  editorStep,
  previewStep,
  children,
  presetConfig,
  codeConfigProps,
  globalConfig,
}: {
  editorStep: EditorStep
  previewStep: React.ReactNode
  children: React.ReactNode
  presetConfig?: PresetConfig
  codeConfigProps: CodeConfigProps
  globalConfig: GlobalConfig
}) {
  const [step, setStep] = React.useState({
    editorStep,
    previewStep,
    presetConfig,
    codeConfigProps,
    selectedId: undefined,
  })

  const resetFocus = () =>
    setStep({
      editorStep,
      previewStep,
      presetConfig,
      codeConfigProps,
      selectedId: undefined,
    })
  const setFocus = ({
    fileName,
    focus,
    id,
  }: {
    fileName?: string
    focus: string | null
    id: string
  }) => {
    const newEditorStep = updateEditorStep(
      step.editorStep,
      fileName,
      focus
    )

    setStep({
      ...step,
      editorStep: newEditorStep,
      selectedId: id,
    })
  }

  return (
    <StaticStepContext.Provider
      value={{
        ...step,
        setFocus,
        globalConfig,
      }}
    >
      <LinkableSection
        onActivation={setFocus}
        onReset={resetFocus}
      >
        {children}
      </LinkableSection>
    </StaticStepContext.Provider>
  )
}

function DynamicScrollycoding({
  globalConfig,
  // data
  children,
  editorSteps,
  presetConfig,
  hasPreviewSteps,
  // local config
  staticMediaQuery,
  start = 0,
  // element props:
  className,
  style,
  // code config props
  ...codeConfigProps
}: ScrollycodingProps) {
  const { stepsChildren, previewChildren } =
    extractPreviewSteps(children, hasPreviewSteps)

  const withPreview = presetConfig || hasPreviewSteps

  const [state, setState] = React.useState({
    stepIndex: start,
    step: editorSteps[start],
  })

  const tab = state.step
  let step = 0
  let time = 3000

  // 自动播放
  useEffect(() => {

    const timer = setInterval(() => {
      onStepChange(step);
      step = (step + 1) % editorSteps.length;
    }, time);

    return () => {
      clearInterval(timer);
    };
  }, []);

  function onStepChange(index: number) {
    setState({ stepIndex: index, step: editorSteps[index] })
  }

  function onTabClick(filename: string) {
    const newStep = updateEditorStep(
      state.step,
      filename,
      null
    )
    setState({ ...state, step: newStep })
  }

  function onLinkActivation(
    stepIndex: number,
    filename: string | undefined,
    focus: string | null
  ) {
    const newStep = updateEditorStep(
      editorSteps[stepIndex],
      filename,
      focus
    )
    setState({ ...state, stepIndex, step: newStep })
  }

  return (
    <section
      className={`ch-scrollycoding ${
        withPreview ? "ch-scrollycoding-with-preview" : ""
      } ${className || ""}`}
      style={style}
      data-ch-theme={globalConfig?.themeName}
    >
      {/* <div className="ch-scrollycoding-content">
        <Scroller
          onStepChange={onStepChange}
          triggerPosition={globalConfig?.triggerPosition}
        >
          {stepsChildren.map((children, i) => (
            <ScrollerStep
              as="div"
              key={i}
              index={i}
              onClick={() => onStepChange(i)}
              className="ch-scrollycoding-step-content"
              data-selected={
                i === state.stepIndex ? "true" : undefined
              }
            >
              <LinkableSection
                onActivation={({ fileName, focus }) => {
                  onLinkActivation(i, fileName, focus)
                }}
                onReset={() => {
                  onStepChange(i)
                }}
              >
                {children}
              </LinkableSection>
            </ScrollerStep>
          ))}
        </Scroller>
      </div> */}
      <TabTitle title={state?.step?.northPanel.active}></TabTitle>
      <div style={{ 
        display: 'flex', 
        height: '100vw', 
        alignItems: 'center',
        background: '#212121', // 背景色
        position: 'fixed', 
        left: 0, 
        top: 0, 
      }}>
        <div className="ch-scrollycoding-sticker">
          <InnerCode
            editorStep={tab}
            globalConfig={globalConfig}
            onTabClick={onTabClick}
            codeConfigProps={{
              showExpandButton: true,
              ...codeConfigProps,
              rows: undefined, // rows are not supported in scrollycoding
            }}
          />
          {presetConfig ? (
            <Preview
              className="ch-scrollycoding-preview"
              files={tab.files}
              globalConfig={globalConfig}
              presetConfig={presetConfig}
            />
          ) : hasPreviewSteps ? (
            <Preview
              className="ch-scrollycoding-preview"
              {...previewChildren[state.stepIndex]["props"]}
              globalConfig={globalConfig}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}


function TabTitle({ title }: { title: string }) {
  if (!title) {
    return <div />
  }

  const separatorIndex = title.lastIndexOf("/") + 1
  const filename = title.substring(separatorIndex)
  const folder = title.substring(0, separatorIndex)

  return (
    // 间距
    <div style={{ position: 'fixed', zIndex: 999, color: '#e3e3e3',top: '5%', left: '60px',fontSize: '20px', display: 'flex', 'alignItems': 'center' }}>
      <Image src="/file.svg" alt="file" width="28" height={28} style={{ opacity: '50%',marginRight: '8px' }}></Image>
      <span style={{ opacity: 0.5 }}>{folder}</span>
      {filename}
    </div>
  )
}