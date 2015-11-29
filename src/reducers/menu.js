import * as types from '../constants/action-types';
import { List, Record } from 'immutable';

const Menu = Record({
  keywords: List(),
  activeKeyword: 'all',
  bookmarkFilter: 1,
  bookmarkFilterX: 15,
  keywordInput: '',
  isMenuOpen: false
});

export default function menu(state = Menu(), action) {
  switch(action.type){
    case types.INITIALIZE_KEYWORD :
      return Menu({keywords: List(action.keywords)});

    case types.SELECT_KEYWORD :
      return state.merge({activeKeyword: action.keyword});

    case types.CHANGE_BOOKMARK_FILTER :
      return state.merge({
        bookmarkFilter: action.value,
        bookmarkFilterX: action.x
      });

    case types.CHANGE_KEYWORD_INPUT :
      return state.merge({keywordInput: action.value});

    case types.ADD_KEYWORD :
      return state.merge({
        activeKeyword: action.keyword,
        keywordInput: ''
      });

    case types.ADD_KEYWORD_COMPLETE :
      return state.merge({keywords: List(action.keywords)});

    case types.TOGGLE_MENU :
      return state.merge({isMenuOpen: !state.isMenuOpen});

    case types.REMOVE_KEYWORD :
      let activeKeyword = state.activeKeyword;
      if (action.keywords.length === 0 || action.keyword === state.activeKeyword)
        activeKeyword = 'all';
      return state.merge({
        keywords: List(action.keywords),
        activeKeyword
      });

    default:
      return state;
  }
}
