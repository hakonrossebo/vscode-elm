port module Main exposing (..)

import Platform
import Json.Decode

port fromElm : String -> Cmd msg

port toElm : (String -> msg) -> Sub msg

main : Program Never () Msg
main = Platform.program
  { init = ((), Cmd.none)
  , update = update
  , subscriptions = \model -> toElm Msg
  }

type alias Model = ()




type Msg = 
  Msg String 

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of 
    Msg i -> 
      (model, fromElm (computeSomething i))

computeSomething : String -> String
computeSomething i = 
  i ++ " contains " ++ toString (String.length i) ++ " characters. With .elm file watching!"