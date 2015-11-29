import * as types from '../constants/action-types';
import _ from 'lodash';
import { List, Map, Record } from 'immutable';

const Item = Record({
  link: null,
  title: null,
  content: null,
  contentSnippet: null,
  publishedDate: null,
  categories: null,
  isFavorited: null,
  isCommentFetching: false,
  isCommentOpen: false,
  comments: List()
});

const Props = Record({
  page : 0,
  items : List([]),
  isPageEnd : false,
  isInfiniteLoading : false,
  elementHeight : 200
});

const Feed = Record({
  isInitialized: false,
  keywords: Map({
    all: Props(),
    favorite: Props()
  })
});

function _getItemsUpdatedByFavorite(items, favorites) {
  return items.map(item => {
    if (favorites.some(f => f.link === item.link)) {
      return item.merge({isFavorited: true});
    } else {
      return item.merge({isFavorited: false});
    }
  });
}

// FIXME
function _updateAllByFavorite(state, favorites) {
  return state.updateIn(['keywords'], keywords =>
    keywords.map(props =>
      props.merge({items: _getItemsUpdatedByFavorite(props.items, favorites)}
    )
  ));
}

function isValidList(value) {
  return List.isList(value) && value.size > 0;
}

export default function feed(state = Feed(), action) {
  let newState;
  let keywords;
  let elementHeight;
  switch(action.type){
    case types.INITIALIZING :
      return Feed();

    case types.INITIALIZE_KEYWORD :
      keywords = Map(action.keywords.map(keyword => [keyword.name, Props()]));
      return state.mergeDeep({
        keywords: keywords.mergeDeep({
          favorite: {
            isPageEnd: true,
            isInfiniteLoading: false
          }
        }),
        isInitialized: true
      });

    case types.INITIALIZE_FAVORITE :
      return state.setIn(['keywords', 'favorite', 'items'], List(action.favorites.map(Item)));

    case types.ADD_FAVORITE :
      newState = state;
      if (action.item !== null) {
        newState = newState.updateIn(
          ['keywords', 'favorite', 'items'],
          items => items.push(Item({
            ...action.item,
            isFavorite: true
          }))
        );
      }
      if (isValidList(newState.keywords.get('favorite').elementHeight))
        newState = newState.updateIn(
          ['keywords', 'favorite', 'elementHeight'],
          elementHeight => elementHeight.push(200)
        );
      else
        newState = newState.setIn(['keywords', 'favorite', 'elementHeight'], 200);
      newState = _updateAllByFavorite(newState, newState.keywords.get('favorite').items);
      return newState;

    case types.REMOVE_FAVORITE : {
      newState = state;
      let index = newState.getIn(['keywords', 'favorite', 'items']).findIndex(item => item.link === action.item.link);
      if (index > -1) {
        newState = newState.updateIn(
          ['keywords', 'favorite', 'items'],
          items => items.delete(index)
        );
        if (isValidList(newState.keywords.get('favorite').elementHeight)) {
          let newState = newState.updateIn(
            ['keywords', 'favorite', 'elementHeight'],
            elementHeight => elementHeight.delete(index)
          );
        }
      }
      newState = _updateAllByFavorite(newState, newState.keywords.get('favorite').items);
      return newState;
    }

    case types.FILTER_FAVORITE_ITEMS:
      return state.setIn(['keywords', 'favorite', 'items'], List(action.items.map(Item)));

    case types.RECIEVE_ITEMS :
      const items = _getItemsUpdatedByFavorite(List(action.items.map(Item)), state.keywords.get('favorite').items);
      const keyword = action.keyword;
      const elementHeight = items.map(item => 200);
      newState = state;
      if (isValidList(elementHeight)) {
        if (isValidList(newState.keywords.get('all').elementHeight))
          newState = newState.updateIn(
            ['keywords', 'all', 'elementHeight'],
            height => height.concat(elementHeight)
          );
        else
          newState = newState.setIn(
            ['keywords', 'all', 'elementHeight'],
            elementHeight
          );
        if (isValidList(newState.keywords.get(keyword).elementHeight))
          newState = newState.updateIn(
            ['keywords', keyword, 'elementHeight'],
            height => height.concat(elementHeight)
          );
        else
          newState = newState.setIn(
            ['keywords', keyword, 'elementHeight'],
            elementHeight
          );
      }
      newState = newState.setIn(['keywords', keyword, 'isInfiniteLoading'], false);
      if (items.size === 0) {
        return newState.setIn(['keywords', keyword, 'isPageEnd'], true);
      }
      newState = newState.updateIn(
        ['keywords', 'all', 'items'],
        list => list.concat(items)
      );
      newState = newState.updateIn(
        ['keywords', keyword],
        props => props.merge({
          isPageEnd: action.length === 0,
          page: props.page + 1,
          items: props.items.concat(items)
        })
      );
      return newState;

    case types.CLEAR_ITEMS :
      keywords = Map(action.keywords.map(keyword => [keyword.name, Props()]));
      keywords = keywords.merge({
        all: Props(),
        favorite: state.keywords.get('favorite')
      });
      return state.merge({keywords});

    case types.FETCHING_ITEMS :
      return state.setIn(['keywords', action.keyword, 'isInfiniteLoading'], true);

    case types.ADD_KEYWORD :
      return state.setIn(['keywords', action.keyword], Props());

    case types.REMOVE_KEYWORD :
    return state.setIn(['keywords', 'all'], Props());

    case types.FETCHING_COMMENT :
      return state.updateIn(['keywords', action.keyword, 'items'], items =>
        items.map(item => {
          if (item.link === action.link) {
            return item.merge({
              isCommentFetching: true
            });
          } else {
            return item;
          }
        })
      );

    case types.OPEN_COMMENT :
      return state.updateIn(['keywords', action.keyword, 'items'], items =>
        items.map(item => {
          if (item.link === action.link) {
            return item.merge({
              isCommentFetching: false,
              isCommentOpen: true,
              comments: List(action.comments)
            });
          } else {
            return item;
          }
        })
      );

    case types.CLOSE_COMMENT :
      return state.updateIn(['keywords', action.keyword, 'items'], items =>
        items.map(item => {
          if (item.link === action.link) {
            return item.merge({
              isCommentOpen: false
            });
          } else {
            return item;
          }
        })
      );

    case types.CHANGE_ELEMENT_HEIGHT :
      if (action.elementHeight.length) {
        return state.setIn(['keywords', action.keyword, 'elementHeight'], List(action.elementHeight));
      } else {
        return state.setIn(['keywords', action.keyword, 'elementHeight'], action.elementHeight);
      }

    default:
      return state;
  }
}
