import React, { useState } from 'react';
import {Meta, StoryObj} from '@storybook/react';
import ContentHeaderContainer from './ContentHeaderContainer';
import { useParameter } from "@storybook/addons";
import { AppLayoutContext } from '../AppLayoutProvider';  // Assuming this is the correct import path

const meta: Meta<typeof ContentHeaderContainer> = {
  title: 'ContentHeaderContainer/ContentHeaderContainer',
  component: ContentHeaderContainer,
  tags: ['autodocs'],
  argTypes: {},
  decorators:[ContentHeaderDecorator]
};

export default meta;

type StoryType = StoryObj<typeof ContentHeaderContainer>;


// ContentHeaderDecorator
function ContentHeaderDecorator(Story: any) {
  const initialState = useParameter('contentHeader', {
    contentHeader: <></>
  });

  const [state, setState] = useState(initialState);

  return (
    // @ts-ignore
    <AppLayoutContext.Provider value={state}>
      <Story/>
    </AppLayoutContext.Provider>
  );
}

export const Shown: StoryType = (args: any) => <ContentHeaderContainer {...args} />;
Shown.parameters = {
  contentHeader: {
    contentHeader: null
  }
};

export const ContentHeaderHasComponent: StoryType = (args: any) => <ContentHeaderContainer {...args} />;
ContentHeaderHasComponent.parameters = {
  contentHeader: {
    contentHeader: <div>Some Component</div>
  }
};

export const ContentHeaderIsStillBeingSet: StoryType = (args: any) => <ContentHeaderContainer {...args} />;
ContentHeaderIsStillBeingSet.parameters = {
  contentHeader: {
    contentHeader: 'Loading...'
  }
};

